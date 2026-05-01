import { Request, Response } from "express";
import prisma from "../config/db";

export const getAllReminders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
    }

    const productId = req.params.productId as string;

    const product = await prisma.product.findFirst({
      where: { id: productId, userId: req.user!.id },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const reminders = await prisma.reminder.findMany({ where: { productId } });
    return res.status(200).json(reminders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch reminders" });
  }
};

export const createReminder = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const daysBefore = req.body.daysBefore as number;

    if (!productId || !daysBefore) {
      return res
        .status(400)
        .json({ error: "productId / daysBefore parameter is required" });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: req.user!.id,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const remindAt = new Date(product.warrantyExpiry);
    remindAt.setDate(remindAt.getDate() - daysBefore);

    const newReminder = await prisma.reminder.create({
      data: {
        remindAt,
        productId,
      },
    });
    return res.status(201).json(newReminder);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create reminder" });
  }
};

export const deleteReminder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ error: "id parameter is required" });
    }

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: { product: { select: { userId: true } } },
    });

    if (!reminder || reminder.product.userId !== req.user!.id) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    await prisma.reminder.delete({ where: { id } });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete reminder" });
  }
};

export const getUserReminders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unautorized" });
    }
    const reminders = await prisma.reminder.findMany({
      where: {
        product: { userId: req.user.id },
      },
      include: { product: { select: { id: true, name: true, picture: true } } },
      orderBy: { remindAt: "asc" },
    });
    return res.status(200).json(reminders);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: `Failed to fetch reminders of ${req.user?.name}` });
  }
};

export const markReminderRead = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.reminder.update({ where: { id }, data: { isRead: true } });
  } catch (error) {}
};
