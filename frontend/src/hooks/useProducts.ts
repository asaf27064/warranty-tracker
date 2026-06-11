import { useState } from "react";
import api from "../api/axios";
import type {
  CreateProductData,
  Product,
  UpdateProductData,
  Stats,
} from "../types/index";

export type ProductQuery = {
  search?: string;
  status?: string;
  category?: string;
  sort?: string;
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    active: 0,
    expiringSoon: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(false);

  const getAllProducts = async (params: ProductQuery = {}) => {
    setLoading(true);
    try {
      // Only send meaningful params; "ALL"/empty mean "no filter".
      const query: Record<string, string> = {};
      if (params.search) query.search = params.search;
      if (params.status && params.status !== "ALL") query.status = params.status;
      if (params.category && params.category !== "ALL")
        query.category = params.category;
      if (params.sort) query.sort = params.sort;

      const res = await api.get("/api/products", { params: query });
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  };

  const getStats = async () => {
    const res = await api.get("/api/products/stats");
    setStats(res.data);
  };

  const getProductById = async (id: string) => {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
  };

  const createProduct = async (data: CreateProductData) => {
    const res = await api.post("/api/products", data);
    return res.data;
  };

  const updateProduct = async (id: string, data: UpdateProductData) => {
    const res = await api.put(`/api/products/${id}`, data);
    return res.data;
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/api/products/${id}`);
  };

  return {
    products,
    stats,
    loading,
    getAllProducts,
    getStats,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
