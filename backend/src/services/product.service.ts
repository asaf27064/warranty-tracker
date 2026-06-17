import { z } from "zod";
import prisma from "../config/db";
import { createProductSchema } from "../schemas/product.schema";
import { getWarrantyStatus } from "../utils/getWarrantyStatus";

// Framework-agnostic product business logic, shared by the HTTP controllers
// and the chat agent so there is a single source of truth (validated by Zod).

// Warranties are covered through their whole expiry day, so "upcoming" is
// measured from the start of today rather than the current instant.
function startOfTodayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = Partial<CreateProductInput>;

export type SortField = "created" | "name" | "store" | "category" | "expiry";
export type SortDir = "asc" | "desc";

export type ProductFilters = {
  query?: string;
  status?: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "ATTENTION";
  category?: string;
  sort?: SortField;
  dir?: SortDir;
};

const SORT_COLUMN: Record<SortField, string> = {
  created: "createdAt",
  name: "name",
  store: "store",
  category: "category",
  expiry: "warrantyExpiry",
};

// A unique `id` tiebreaker (same direction) keeps cursor pagination
// deterministic even when the primary sort field has ties.
function buildOrderBy(filters: ProductFilters): object[] {
  // The "needs attention" view leads with actionable items (expiring soon,
  // soonest first) and lists the already-expired ones after.
  if (filters.status === "ATTENTION") {
    return [{ status: "asc" }, { warrantyExpiry: "asc" }, { id: "asc" }];
  }
  const field = filters.sort ?? "created";
  const direction = filters.dir ?? (filters.sort ? "asc" : "desc");
  const column = SORT_COLUMN[field];
  return [{ [column]: direction }, { id: direction }];
}

// Cap on how many products the agent pulls in one tool call (avoids huge
// tool results / token blowups when a user has thousands of products).
const AGENT_LIMIT = 100;

const REMINDER_DAYS = [30, 7, 1];

async function createExpiryReminders(
  db: Pick<typeof prisma, "reminder">,
  productId: string,
  warrantyExpiry: Date,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const days of REMINDER_DAYS) {
    const remindAt = new Date(warrantyExpiry);
    remindAt.setDate(remindAt.getDate() - days);
    remindAt.setHours(8, 0, 0, 0);
    if (remindAt >= today) {
      await db.reminder.create({
        data: { remindAt, productId, isDefault: true },
      });
    }
  }
}

export async function createProduct(userId: string, input: CreateProductInput) {
  // Validates with the same Zod schema the HTTP routes use.
  const data = createProductSchema.parse(input);

  const purchaseDate = new Date(data.purchaseDate);
  const warrantyExpiry = new Date(purchaseDate);
  warrantyExpiry.setMonth(warrantyExpiry.getMonth() + data.warrantyMonths);
  const status = getWarrantyStatus(purchaseDate, warrantyExpiry);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        store: data.store ?? null,
        picture: data.picture ?? null,
        userId,
        purchaseDate,
        warrantyExpiry,
        warrantyMonths: data.warrantyMonths,
        category: data.category,
        status,
      },
    });

    await createExpiryReminders(tx, product.id, warrantyExpiry);
    return product;
  });
}

function buildWhere(userId: string, filters: ProductFilters) {
  const query = filters.query?.trim();
  return {
    userId,
    ...(filters.status
      ? filters.status === "ATTENTION"
        ? { status: { in: ["EXPIRING_SOON", "EXPIRED"] } as never }
        : { status: filters.status }
      : {}),
    ...(filters.category ? { category: filters.category as never } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { store: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

// Used by the CSV export - all matching products for the user, no pagination.
export async function getProductsForExport(
  userId: string,
  filters: ProductFilters = {},
) {
  return prisma.product.findMany({
    where: buildWhere(userId, filters),
    orderBy: buildOrderBy(filters),
  });
}

// Bulk delete. Scoped by userId so a user can only delete their own products;
// documents and reminders cascade at the DB level. Returns the count deleted.
export async function deleteProducts(userId: string, ids: string[]) {
  const result = await prisma.product.deleteMany({
    where: { id: { in: ids }, userId },
  });
  return result.count;
}

// Used by the agent - returns a bounded array of matching products.
export async function searchProducts(
  userId: string,
  filters: ProductFilters = {},
) {
  return prisma.product.findMany({
    where: buildWhere(userId, filters),
    orderBy: buildOrderBy(filters),
    take: AGENT_LIMIT,
  });
}

// Used by the HTTP list endpoint - cursor-paginated. Fetches `limit + 1` rows
// to detect whether another page exists, then returns the page + next cursor.
export async function listProducts(
  userId: string,
  filters: ProductFilters = {},
  page: { limit?: number; cursor?: string } = {},
) {
  const limit = Math.min(Math.max(page.limit ?? 20, 1), 100);
  const where = buildWhere(userId, filters);

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(filters),
      take: limit + 1,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
    }),
    prisma.product.count({ where }),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export async function getProductStats(userId: string) {
  const [byStatus, byCategory, soonest] = await Promise.all([
    prisma.product.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.product.groupBy({
      by: ["category"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.product.findFirst({
      where: { userId, warrantyExpiry: { gte: startOfTodayDate() } },
      orderBy: { warrantyExpiry: "asc" },
      select: { name: true, warrantyExpiry: true },
    }),
  ]);

  let nextExpiry: { name: string; date: Date; count: number } | null = null;
  if (soonest) {
    const dayStart = new Date(soonest.warrantyExpiry);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(soonest.warrantyExpiry);
    dayEnd.setHours(23, 59, 59, 999);
    const sameDay = await prisma.product.count({
      where: { userId, warrantyExpiry: { gte: dayStart, lte: dayEnd } },
    });
    nextExpiry = {
      name: soonest.name,
      date: soonest.warrantyExpiry,
      count: sameDay,
    };
  }

  const stats = {
    active: 0,
    expiringSoon: 0,
    expired: 0,
    total: 0,
    byCategory: {} as Record<string, number>,
    nextExpiry,
  };
  for (const g of byStatus) {
    if (g.status === "ACTIVE") stats.active = g._count._all;
    else if (g.status === "EXPIRING_SOON") stats.expiringSoon = g._count._all;
    else if (g.status === "EXPIRED") stats.expired = g._count._all;
  }
  for (const g of byCategory) {
    stats.byCategory[g.category] = g._count._all;
  }
  stats.total = stats.active + stats.expiringSoon + stats.expired;
  return stats;
}

export async function getExpiringWarranties(
  userId: string,
  withinDays: number,
) {
  const days = Number(withinDays) || 30;
  const until = new Date();
  until.setDate(until.getDate() + days);
  return prisma.product.findMany({
    where: {
      userId,
      warrantyExpiry: { gte: startOfTodayDate(), lte: until },
    },
    orderBy: { warrantyExpiry: "asc" },
  });
}

export async function getProductById(
  userId: string,
  id: string,
  opts: { include?: boolean } = {},
) {
  return prisma.product.findFirst({
    where: { id, userId },
    ...(opts.include ? { include: { documents: true, reminders: true } } : {}),
  });
}

export async function updateProduct(
  userId: string,
  id: string,
  input: UpdateProductInput,
) {
  const product = await prisma.product.findFirst({ where: { id, userId } });
  if (!product) return null;

  const purchaseDate = input.purchaseDate
    ? new Date(input.purchaseDate)
    : product.purchaseDate;
  const warrantyMonths = input.warrantyMonths ?? product.warrantyMonths;
  const warrantyExpiry = new Date(purchaseDate);
  warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);
  const status = getWarrantyStatus(purchaseDate, warrantyExpiry);
  const warrantyChanged =
    purchaseDate.getTime() !== product.purchaseDate.getTime() ||
    warrantyMonths !== product.warrantyMonths;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: {
        name: input.name ?? product.name,
        store: input.store !== undefined ? input.store : product.store,
        picture: input.picture !== undefined ? input.picture : product.picture,
        purchaseDate,
        warrantyExpiry,
        warrantyMonths,
        category: input.category ?? product.category,
        status,
      },
    });

    if (warrantyChanged) {
      await tx.reminder.deleteMany({
        where: { productId: id, sent: false },
      });
      await createExpiryReminders(tx, id, warrantyExpiry);
    }

    return updated;
  });
}

export async function deleteProduct(userId: string, id: string) {
  const product = await prisma.product.findFirst({ where: { id, userId } });
  if (!product) return false;
  await prisma.product.delete({ where: { id } });
  return true;
}
