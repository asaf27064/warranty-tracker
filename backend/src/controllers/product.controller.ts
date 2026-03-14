import { Request, Response } from "express";
import prisma from "../config/db";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rawSearch = req.query.search as string | undefined;
    const search = rawSearch?.trim();

    const products = await prisma.product.findMany({
      where: {
        userId: req.user.id,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { store: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ error: "id parameter is required" });
    }
    const product = await prisma.product.findFirst({
      where: { id, userId: req.user!.id },
    });

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
    const purchaseDate = new Date(req.body.purchaseDate);
    const warrantyExpiry = new Date(purchaseDate);
    warrantyExpiry.setMonth(
      warrantyExpiry.getMonth() + req.body.warrantyMonths,
    );

    const newProduct = await prisma.product.create({
      data: {
        name: req.body.name,
        store: req.body.store,
        picture: req.body.picture,
        userId: req.user!.id,
        purchaseDate: purchaseDate,
        warrantyExpiry: warrantyExpiry,
        warrantyMonths: req.body.warrantyMonths,
        category: req.body.category,
      },
    });

    return res.status(201).json({ newProduct });
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
    const product = await prisma.product.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const purchaseDate = req.body.purchaseDate
      ? new Date(req.body.purchaseDate)
      : product.purchaseDate;
    const warrantyMonths = req.body.warrantyMonths ?? product.warrantyMonths;
    const warrantyExpiry = new Date(purchaseDate);
    warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: req.body.name ?? product.name,
        store: req.body.store ?? product.store,
        picture: req.body.picture ?? product.picture,
        purchaseDate: purchaseDate,
        warrantyExpiry: warrantyExpiry,
        warrantyMonths: warrantyMonths,
        category: req.body.category ?? product.category,
      },
    });
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
    const product = await prisma.product.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await prisma.product.delete({ where: { id } });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
};
