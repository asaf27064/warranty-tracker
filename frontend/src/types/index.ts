export const WarrantyStatus = {
  ACTIVE: "ACTIVE",
  EXPIRING_SOON: "EXPIRING_SOON",
  EXPIRED: "EXPIRED",
} as const;
export type WarrantyStatus =
  (typeof WarrantyStatus)[keyof typeof WarrantyStatus];

export const Category = {
  NONE: "NONE",
  ELECTRONICS: "ELECTRONICS",
  HOME_KITCHEN: "HOME_KITCHEN",
  PHONES: "PHONES",
  JEWELRY: "JEWELRY",
  KIDS_TOYS: "KIDS_TOYS",
  APPLIANCES: "APPLIANCES",
  FURNITURE: "FURNITURE",
  FASHION: "FASHION",
  AUTOMOTIVE: "AUTOMOTIVE",
  SPORTS: "SPORTS",
  TOOLS: "TOOLS",
  OTHER: "OTHER",
} as const;
export type Category = (typeof Category)[keyof typeof Category];

export const DocumentType = {
  RECEIPT: "RECEIPT",
  INVOICE: "INVOICE",
  WARRANTY_CERTIFICATE: "WARRANTY_CERTIFICATE",
  PHOTO: "PHOTO",
  OTHER: "OTHER",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export type User = {
  id: string;
  googleId: string;
  avatarUrl?: string;
  name: string;
  email: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  theme: string;
  defaultView: string;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferences = Pick<
  User,
  | "emailNotifications"
  | "pushNotifications"
  | "inAppNotifications"
  | "theme"
  | "defaultView"
  | "onboarded"
>;

export type Product = {
  id: string;
  name: string;
  category: Category;
  store?: string;
  picture?: string;
  status: WarrantyStatus;
  purchaseDate: string;
  warrantyExpiry: string;
  warrantyMonths: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductData = {
  name: string;
  category: Category;
  purchaseDate: string;
  warrantyMonths: number;
  store?: string;
  picture?: string;
};

export type UpdateProductData = {
  name?: string;
  category?: Category;
  purchaseDate?: string;
  warrantyMonths?: number;
  store?: string | null;
  picture?: string | null;
};

export type Stats = {
  active: number;
  expiringSoon: number;
  expired: number;
  total?: number;
  byCategory?: Record<string, number>;
  nextExpiry?: { name: string; date: string; count: number } | null;
};

export type Document = {
  id: string;
  productId: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  docType: DocumentType;
  uploadedAt: string;
};

export type Reminder = {
  id: string;
  remindAt: string;
  sent: boolean;
  sentAt?: string;
  isRead: boolean;
  productId: string;
  createdAt: string;
};

export const CategoryLabels: Record<string, string> = {
  NONE: "None",
  ELECTRONICS: "Electronics",
  HOME_KITCHEN: "Home & Kitchen",
  PHONES: "Phones",
  JEWELRY: "Jewelry",
  KIDS_TOYS: "Kids & Toys",
  APPLIANCES: "Appliances",
  FURNITURE: "Furniture",
  FASHION: "Fashion",
  AUTOMOTIVE: "Automotive",
  SPORTS: "Sports",
  TOOLS: "Tools",
  OTHER: "Other",
};

export const DocTypeLabels: Record<string, string> = {
  RECEIPT: "Receipt",
  INVOICE: "Invoice",
  WARRANTY_CERTIFICATE: "Warranty Certificate",
  PHOTO: "Photo",
  OTHER: "Other",
};

export const StatusLabels: Record<string, string> = {
  ACTIVE: "Active",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
};
