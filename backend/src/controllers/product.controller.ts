import { Request, Response } from "express";
import * as productService from "../services/product.service";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const page = await productService.listProducts(
      req.user.id,
      {
        query: (req.query.search as string | undefined)?.trim(),
        status: req.query.status as never,
        category: req.query.category as string | undefined,
        sort: req.query.sort as never,
        dir: req.query.dir as never,
      },
      {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        cursor: req.query.cursor as string | undefined,
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
    return res.status(204).json({ message: "Product deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
};
