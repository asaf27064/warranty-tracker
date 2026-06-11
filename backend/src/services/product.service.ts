import { z } from "zod";
import prisma from "../config/db";
import { createProductSchema } from "../schemas/product.schema";
import { getWarrantyStatus } from "../utils/getWarrantyStatus";

// Framework-agnostic product business logic, shared by the HTTP controllers
// and the chat agent so there is a single source of truth (validated by Zod).

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = Partial<CreateProductInput>;

export type ProductFilters = {
  query?: string;
  status?: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
  category?: string;
};

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

export async function searchProducts(userId: string, filters: ProductFilters = {}) {
  const query = filters.query?.trim();
  return prisma.product.findMany({
    where: {
      userId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.category ? { category: filters.category as never } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { store: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
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
