import cron from "node-cron";
import prisma from "../config/db";
import { sendReminderEmail } from "./email.service";

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

  for (const reminder of dueReminders) {
    const daysLeft = Math.ceil(
      (new Date(reminder.product.warrantyExpiry).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    try {
      await sendReminderEmail(
        reminder.product.user.email,
        reminder.product.name,
        daysLeft,
      );
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sent: true, sentAt: now },
      });
    } catch (error) {
      console.error(`Failed to send email for reminder ${reminder.id}:`, error);
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
