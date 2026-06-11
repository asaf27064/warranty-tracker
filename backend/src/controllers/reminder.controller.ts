import { Request, Response } from "express";
import * as reminderService from "../services/reminder.service";

export const getAllReminders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const productId = req.params.productId as string;
    const reminders = await reminderService.getProductReminders(
      req.user.id,
      productId,
    );
    if (reminders === null) {
      return res.status(404).json({ error: "Product not found" });
    }
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

    const result = await reminderService.createReminder(
      req.user!.id,
      productId,
      daysBefore,
    );

    if (result.status === "not_found") {
      return res.status(404).json({ error: "Product not found" });
    }
    if (result.status === "exists") {
      return res
        .status(409)
        .json({ error: "Reminder already exists for this date" });
    }
    return res.status(201).json(result.reminder);
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
    const deleted = await reminderService.deleteReminder(req.user!.id, id);
    if (!deleted) {
      return res.status(404).json({ error: "Reminder not found" });
    }
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete reminder" });
  }
};

export const getUserReminders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const reminders = await reminderService.getUserReminders(req.user.id);
    return res.status(200).json(reminders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch reminders" });
  }
};

export const markReminderRead = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const marked = await reminderService.markReminderRead(req.user!.id, id);
    if (!marked) {
      return res.status(404).json({ error: "Reminder not found" });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to mark reminder as read" });
  }
};
