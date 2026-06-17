import { Request, Response } from "express";
import * as productService from "../services/product.service";
import type { z } from "zod";
import type { getAllProductsQuerySchema } from "../schemas/product.schema";

type ProductListQuery = z.infer<typeof getAllProductsQuerySchema>;

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const query = (req.validated?.query ?? req.query) as ProductListQuery;
    const page = await productService.listProducts(
      req.user.id,
      {
        query: query.search?.trim(),
        status: query.status,
        category: query.category,
        sort: query.sort,
        dir: query.dir,
      },
      {
        limit: query.limit,
        cursor: query.cursor,
      },
    );
    return res.status(200).json(page);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
};

export const getProductStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const stats = await productService.getProductStats(req.user.id);
    return res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const exportProducts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const query = (req.validated?.query ?? req.query) as ProductListQuery;
    const products = await productService.getProductsForExport(req.user.id, {
      query: query.search?.trim(),
      status: query.status,
      category: query.category,
      sort: query.sort,
      dir: query.dir,
    });
    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to export products" });
  }
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    const deleted = await productService.deleteProducts(req.user!.id, ids);
    return res.status(200).json({ deleted });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete products" });
  }
};

export const setProductsArchived = async (req: Request, res: Response) => {
  try {
    const { ids, archived } = req.body as { ids: string[]; archived: boolean };
    const count = await productService.setProductsArchived(
      req.user!.id,
      ids,
      archived,
    );
    return res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update products" });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ error: "id parameter is required" });
    }
    const product = await productService.getProductById(req.user!.id, id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const newProduct = await productService.createProduct(req.user!.id, req.body);
    return res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create product" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ error: "id parameter is required" });
    }
    const updated = await productService.updateProduct(req.user!.id, id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update product" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ error: "id parameter is required" });
    }
    const deleted = await productService.deleteProduct(req.user!.id, id);
    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
};
