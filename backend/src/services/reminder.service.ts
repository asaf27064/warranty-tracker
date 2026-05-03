import cron from "node-cron";
import prisma from "../config/db";

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

  // 3. mark due reminders as sent
  await prisma.reminder.updateMany({
    where: {
      remindAt: { lte: now },
      sent: false,
    },
    data: { sent: true, sentAt: now },
  });
};

export const startReminderCron = () => {
  cron.schedule("0 8 * * *", processReminders, {
    timezone: "Asia/Jerusalem",
  });
  console.log("Reminder cron scheduled (daily 08:00 IST)");
};
