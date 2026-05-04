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

  // 3. find due reminders and send emails
  const dueReminders = await prisma.reminder.findMany({
    where: {
      remindAt: { lte: now },
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
    } catch (error) {
      console.error(`Failed to send email for reminder ${reminder.id}:`, error);
    }

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { sent: true, sentAt: now },
    });
  }
};

export const startReminderCron = () => {
  cron.schedule("0 8 * * *", processReminders, {
    timezone: "Asia/Jerusalem",
  });
  console.log("Reminder cron scheduled (daily 08:00 IST)");
};