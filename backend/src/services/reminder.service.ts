import cron from "node-cron";
import prisma from "../config/db";
import { sendReminderDigestEmail, type ReminderItem } from "./email.service";
import { sendPushToUser } from "./push.service";

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
    userId: string;
    email: string;
    emailOptIn: boolean;
    pushOptIn: boolean;
    reminderIds: string[];
    items: Map<string, ReminderItem>;
  };
  const byUser = new Map<string, Group>();

  for (const reminder of dueReminders) {
    const user = reminder.product.user;
    if (!user.emailNotifications && !user.pushNotifications) continue;
    const group: Group = byUser.get(user.id) ?? {
      userId: user.id,
      email: user.email,
      emailOptIn: user.emailNotifications,
      pushOptIn: user.pushNotifications,
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
    byUser.set(user.id, group);
  }

  for (const group of byUser.values()) {
    const items = [...group.items.values()];
    let delivered = false;

    if (group.emailOptIn) {
      try {
        await sendReminderDigestEmail(group.email, items);
        delivered = true;
      } catch (error) {
        console.error(`Failed to email reminder digest to ${group.email}:`, error);
      }
    }

    if (group.pushOptIn) {
      try {
        const sent = await sendPushToUser(group.userId, {
          title: "Warranty reminder",
          body:
            items.length === 1
              ? `${items[0].productName} needs your attention`
              : `${items.length} products need your attention`,
          url: "/dashboard",
        });
        if (sent > 0) delivered = true;
      } catch (error) {
        console.error(`Failed to push reminder to ${group.email}:`, error);
      }
    }

    if (delivered) {
      await prisma.reminder.updateMany({
        where: { id: { in: group.reminderIds } },
        data: { sent: true, sentAt: now },
      });
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
  | { status: "expired" }
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

  // A reminder is pointless once the warranty has already expired.
  if (product.warrantyExpiry.getTime() <= Date.now()) {
    return { status: "expired" };
  }

  const remindAt = new Date(product.warrantyExpiry);
  remindAt.setDate(remindAt.getDate() - Number(daysBefore));
  remindAt.setHours(8, 0, 0, 0);
  // If that lead time is already in the past (short remaining warranty),
  // schedule it for now, floored to the minute so repeat clicks dedupe cleanly.
  if (remindAt.getTime() < Date.now()) {
    const soon = new Date();
    soon.setSeconds(0, 0);
    remindAt.setTime(soon.getTime());
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

const DEFAULT_REMINDER_DAYS = [30, 7, 1];

// Recreate any of the 30/7/1-day default reminders that are missing and still
// in the future. Used to undo deleting a default. Idempotent: existing ones are
// left alone. Returns the number of reminders created, or null if not found.
export async function restoreDefaultReminders(
  userId: string,
  productId: string,
): Promise<number | null> {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
  });
  if (!product) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;
  for (const days of DEFAULT_REMINDER_DAYS) {
    const remindAt = new Date(product.warrantyExpiry);
    remindAt.setDate(remindAt.getDate() - days);
    remindAt.setHours(8, 0, 0, 0);
    if (remindAt < today) continue;

    const existing = await prisma.reminder.findFirst({
      where: { productId, remindAt },
    });
    if (existing) continue;

    await prisma.reminder.create({
      data: { remindAt, productId, isDefault: true },
    });
    created += 1;
  }
  return created;
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

// Mark every unread reminder for the user as read (clears the bell's badge).
export async function markAllRemindersRead(userId: string) {
  const res = await prisma.reminder.updateMany({
    where: { product: { userId }, isRead: false },
    data: { isRead: true },
  });
  return res.count;
}

// Clear notifications: delete the already-fired reminders (remindAt in the
// past). Upcoming reminders are kept.
export async function clearFiredReminders(userId: string) {
  const res = await prisma.reminder.deleteMany({
    where: { product: { userId }, remindAt: { lte: new Date() } },
  });
  return res.count;
}
