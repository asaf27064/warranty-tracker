import { type WarrantyStatus } from "../generated/prisma/enums";

const DAY_MS = 1000 * 60 * 60 * 24;

const startOfDay = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const getWarrantyStatus = (
  purchaseDate: Date,
  warrantyExpiry: Date,
): WarrantyStatus => {
  const today = startOfDay(new Date());
  const expiryDay = startOfDay(warrantyExpiry);

  // A warranty is covered through its whole expiry day; it's only expired once
  // that day has fully passed.
  if (expiryDay < today) return "EXPIRED";
  const daysUntilExpiry = Math.round((expiryDay - today) / DAY_MS);
  if (daysUntilExpiry <= 30) return "EXPIRING_SOON";
  return "ACTIVE";
};
