import api from "../api/axios";
import type { CreateProductData, Product, UpdateProductData } from "../types";

export const useProducts = () => {
  const getProductById = async (id: string) => {
    const res = await api.get<Product>(`/api/products/${id}`);
    return res.data;
  };

  const createProduct = async (data: CreateProductData) => {
    const res = await api.post<Product>("/api/products", data);
    return res.data;
  };

  const updateProduct = async (id: string, data: UpdateProductData) => {
    const res = await api.put<Product>(`/api/products/${id}`, data);
    return res.data;
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/api/products/${id}`);
  };

  const bulkDeleteProducts = async (ids: string[]) => {
    const res = await api.post<{ deleted: number }>(
      "/api/products/bulk-delete",
      { ids },
    );
    return res.data.deleted;
  };

  // All products matching the given filter params (no pagination), for export.
  const fetchForExport = async (params: Record<string, string>) => {
    const res = await api.get<Product[]>("/api/products/export", { params });
    return res.data;
  };

  return {
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    fetchForExport,
  };
};

