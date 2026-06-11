import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import type { Product, Stats } from "../types";

export type ProductFilters = {
  search?: string;
  status?: string;
  category?: string;
  sort?: string;
  dir?: string;
};

type ProductsPage = { items: Product[]; nextCursor: string | null };

const PAGE_SIZE = 20;

const buildParams = (f: ProductFilters, cursor?: string) => {
  const params: Record<string, string> = { limit: String(PAGE_SIZE) };
  if (f.search) params.search = f.search;
  if (f.status && f.status !== "ALL") params.status = f.status;
  if (f.category && f.category !== "ALL") params.category = f.category;
  if (f.sort) params.sort = f.sort;
  if (f.dir) params.dir = f.dir;
  if (cursor) params.cursor = cursor;
  return params;
};

// Infinite (cursor-paginated) product list. Changing `filters` starts a fresh
// query (back to page 1) because it's part of the query key.
export const useInfiniteProducts = (filters: ProductFilters) =>
  useInfiniteQuery({
    queryKey: ["products", filters],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<ProductsPage>("/api/products", {
        params: buildParams(filters, pageParam),
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

export const useProductStats = () =>
  useQuery({
    queryKey: ["product-stats"],
    queryFn: async () => {
      const res = await api.get<Stats>("/api/products/stats");
      return res.data;
    },
  });
