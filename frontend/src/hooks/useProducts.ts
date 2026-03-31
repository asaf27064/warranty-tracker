import { useEffect, useState } from "react";
import api from "../api/axios";
import type {
  CreateProductData,
  Product,
  UpdateProductData,
} from "../types/index";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const getAllProducts = async (search?: string) => {
    setLoading(true);
    try {
      const res = await api.get("/api/products", {
        params: search ? { search } : {},
      });
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  };

  const getProductById = async (id: string) => {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
  };

  const createProduct = async (data: CreateProductData) => {
    const res = await api.post("/api/products", data);
    setProducts([...products, res.data]);
    return res.data;
  };

  const updateProduct = async (id: string, data: UpdateProductData) => {
    try {
      const res = await api.put(`/api/products/${id}`, data);

      setProducts((prev) =>
        prev.map((product) => (product.id === id ? res.data : product)),
      );

      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/api/products/${id}`);
    setProducts(products.filter((p) => p.id !== id));
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  return {
    products,
    loading,
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
