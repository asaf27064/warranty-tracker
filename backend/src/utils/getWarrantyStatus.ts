import { type WarrantyStatus } from "../generated/prisma/enums";

export const getWarrantyStatus = (
  purchaseDate: Date,
  warrantyExpiry: Date,
): WarrantyStatus => {
  const now = new Date();

  const diffMs = warrantyExpiry.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) return "EXPIRED";
  if (daysUntilExpiry <= 30) return "EXPIRING_SOON";
  return "ACTIVE";
};
