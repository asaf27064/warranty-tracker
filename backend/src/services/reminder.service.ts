import cron from "node-cron";
import prisma from "../config/db";
import { sendReminderDigestEmail, type ReminderItem } from "./email.service";

export const processReminders = async () => {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // 1. expired
  await prisma.product.updateMany({
    where: {
      warrantyExpiry: { lt: now },
      status: { not: "EXPIRED" },
    },
    data: { status: "EXPIRED" },
  });

  // 2. expiring soon (within 30 days)
  await prisma.product.updateMany({
    where: {
      warrantyExpiry: { gte: now, lte: thirtyDaysFromNow },
      status: "ACTIVE",
    },
    data: { status: "EXPIRING_SOON" },
  });

  const RETRY_GRACE_DAYS = 14;
  const retryFloor = new Date(now);
  retryFloor.setDate(retryFloor.getDate() - RETRY_GRACE_DAYS);

  const dueReminders = await prisma.reminder.findMany({
    where: {
      remindAt: { lte: now, gte: retryFloor },
      sent: false,
    },
    include: {
      product: {
        include: { user: true },
      },
    },
  });

  // Group due reminders into one digest per user. If the same product has
  // several due reminders, keep the most urgent and collect all their ids so
  // they're marked sent together.
  type Group = {
    email: string;
    reminderIds: string[];
    items: Map<string, ReminderItem>;
  };
  const byUser = new Map<string, Group>();

  for (const reminder of dueReminders) {
    if (!reminder.product.user.emailNotifications) continue;
    const email = reminder.product.user.email;
    const group: Group = byUser.get(email) ?? {
      email,
      reminderIds: [],
      items: new Map<string, ReminderItem>(),
    };
    group.reminderIds.push(reminder.id);

    const daysLeft = Math.ceil(
      (new Date(reminder.product.warrantyExpiry).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const existing = group.items.get(reminder.product.id);
    if (!existing || daysLeft < existing.daysLeft) {
      group.items.set(reminder.product.id, {
        productName: reminder.product.name,
        productId: reminder.product.id,
        picture: reminder.product.picture,
        daysLeft,
        warrantyExpiry: reminder.product.warrantyExpiry,
        purchaseDate: reminder.product.purchaseDate,
      });
    }
    byUser.set(email, group);
  }

  for (const group of byUser.values()) {
    try {
      await sendReminderDigestEmail(group.email, [...group.items.values()]);
      await prisma.reminder.updateMany({
        where: { id: { in: group.reminderIds } },
        data: { sent: true, sentAt: now },
      });
    } catch (error) {
      console.error(`Failed to send reminder digest to ${group.email}:`, error);
    }
  }
};

export const startReminderCron = () => {
  cron.schedule("0 8 * * *", processReminders, {
    timezone: "Asia/Jerusalem",
  });
  console.log("Reminder cron scheduled (daily 08:00 IST)");
};


type Reminder = Awaited<ReturnType<typeof prisma.reminder.create>>;

export type CreateReminderResult =
  | { status: "not_found" }
  | { status: "exists"; reminder: Reminder }
  | { status: "created"; reminder: Reminder };

export async function getProductReminders(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
  });
  if (!product) return null; // caller maps to 404
  return prisma.reminder.findMany({ where: { productId } });
}

export async function createReminder(
  userId: string,
  productId: string,
  daysBefore: number,
): Promise<CreateReminderResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
  });
  if (!product) return { status: "not_found" };

  const remindAt = new Date(product.warrantyExpiry);
  remindAt.setDate(remindAt.getDate() - Number(daysBefore));
  remindAt.setHours(8, 0, 0, 0);
  // If that time has already passed (e.g. a short remaining warranty), schedule
  // it for now so it still fires on the next run instead of being silently lost.
  if (remindAt.getTime() < Date.now()) {
    remindAt.setTime(Date.now());
  }

  const existing = await prisma.reminder.findFirst({
    where: { productId, remindAt },
  });
  if (existing) return { status: "exists", reminder: existing };

  const reminder = await prisma.reminder.create({
    data: { remindAt, productId },
  });
  return { status: "created", reminder };
}

export async function getUserReminders(userId: string) {
  return prisma.reminder.findMany({
    where: { product: { userId } },
    include: {
      product: {
        select: { id: true, name: true, picture: true, warrantyExpiry: true },
      },
    },
    orderBy: { remindAt: "asc" },
  });
}

export async function markReminderRead(userId: string, id: string) {
  const reminder = await prisma.reminder.findFirst({
    where: { id, product: { userId } },
  });
  if (!reminder) return false;
  await prisma.reminder.update({ where: { id }, data: { isRead: true } });
  return true;
}

export async function deleteReminder(userId: string, id: string) {
  const reminder = await prisma.reminder.findUnique({
    where: { id },
    include: { product: { select: { userId: true } } },
  });
  if (!reminder || reminder.product.userId !== userId) return false;
  await prisma.reminder.delete({ where: { id } });
  return true;
}
