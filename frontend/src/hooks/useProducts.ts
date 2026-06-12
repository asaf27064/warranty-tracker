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

  return {
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

