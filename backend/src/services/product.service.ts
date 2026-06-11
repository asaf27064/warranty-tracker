import { z } from "zod";
import prisma from "../config/db";
import { createProductSchema } from "../schemas/product.schema";
import { getWarrantyStatus } from "../utils/getWarrantyStatus";

// Framework-agnostic product business logic, shared by the HTTP controllers
// and the chat agent so there is a single source of truth (validated by Zod).

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = Partial<CreateProductInput>;

export type SortOption = "newest" | "oldest" | "expiring" | "name";

export type ProductFilters = {
  query?: string;
  status?: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
  category?: string;
  sort?: SortOption;
};

// A unique `id` tiebreaker is appended so cursor pagination is deterministic
// even when the primary sort field has ties.
const ORDER_BY: Record<SortOption, object[]> = {
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  expiring: [{ warrantyExpiry: "asc" }, { id: "asc" }],
  name: [{ name: "asc" }, { id: "asc" }],
};

// Cap on how many products the agent pulls in one tool call (avoids huge
// tool results / token blowups when a user has thousands of products).
const AGENT_LIMIT = 100;

const REMINDER_DAYS = [30, 7, 1];

async function createExpiryReminders(productId: string, warrantyExpiry: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const days of REMINDER_DAYS) {
    const remindAt = new Date(warrantyExpiry);
    remindAt.setDate(remindAt.getDate() - days);
    remindAt.setHours(8, 0, 0, 0);
    if (remindAt >= today) {
      await prisma.reminder.create({ data: { remindAt, productId } });
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

  const product = await prisma.product.create({
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

  await createExpiryReminders(product.id, warrantyExpiry);
  return product;
}

function buildWhere(userId: string, filters: ProductFilters) {
  const query = filters.query?.trim();
  return {
    userId,
    ...(filters.status ? { status: filters.status } : {}),
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

// Used by the agent — returns a bounded array of matching products.
export async function searchProducts(userId: string, filters: ProductFilters = {}) {
  return prisma.product.findMany({
    where: buildWhere(userId, filters),
    orderBy: ORDER_BY[filters.sort ?? "newest"],
    take: AGENT_LIMIT,
  });
}

// Used by the HTTP list endpoint — cursor-paginated. Fetches `limit + 1` rows
// to detect whether another page exists, then returns the page + next cursor.
export async function listProducts(
  userId: string,
  filters: ProductFilters = {},
  page: { limit?: number; cursor?: string } = {},
) {
  const limit = Math.min(Math.max(page.limit ?? 20, 1), 100);

  const rows = await prisma.product.findMany({
    where: buildWhere(userId, filters),
    orderBy: ORDER_BY[filters.sort ?? "newest"],
    take: limit + 1,
    ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// Status counts across ALL of the user's products (independent of filters),
// for the dashboard stat cards.
export async function getProductStats(userId: string) {
  const grouped = await prisma.product.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const stats = { active: 0, expiringSoon: 0, expired: 0 };
  for (const g of grouped) {
    if (g.status === "ACTIVE") stats.active = g._count._all;
    else if (g.status === "EXPIRING_SOON") stats.expiringSoon = g._count._all;
    else if (g.status === "EXPIRED") stats.expired = g._count._all;
  }
  return stats;
}

export async function getExpiringWarranties(userId: string, withinDays: number) {
  const days = Number(withinDays) || 30;
  const until = new Date();
  until.setDate(until.getDate() + days);
  return prisma.product.findMany({
    where: { userId, warrantyExpiry: { gte: new Date(), lte: until } },
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
    ...(opts.include
      ? { include: { documents: true, reminders: true } }
      : {}),
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

  return prisma.product.update({
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
}

export async function deleteProduct(userId: string, id: string) {
  const product = await prisma.product.findFirst({ where: { id, userId } });
  if (!product) return false;
  await prisma.product.delete({ where: { id } });
  return true;
}
