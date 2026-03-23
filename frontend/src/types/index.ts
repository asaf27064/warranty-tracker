export type Product = {
  _id: any;
  id: string;
  name: string;
  category: string;
  store?: string;
  picture?: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
  purchaseDate: string;
  warrantyExpiry: string;
  warrantyMonths: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductData = {
  name: string;
  category: string;
  purchaseDate: string;
  warrantyMonths: number;
  store?: string;
  picture?: string;
};

export type UpdateProductData = {
  name?: string;
  category?: string;
  purchaseDate?: string;
  warrantyMonths?: number;
  store?: string;
  picture?: string;
};


export type Stats = {
  active: number;
  expiringSoon: number;
  expired: number;
};
