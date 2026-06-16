import "dotenv/config";
import prisma from "../config/db";

// One-off backfill: marks reminders that sit exactly on a 30/7/1-days-before
// expiry slot as isDefault. Run once after the isDefault migration so existing
// (pre-flag) reminders get their "Default" badge. Safe to re-run; idempotent.
const DEFAULT_REMINDER_DAYS = [30, 7, 1];

async function main() {
  const reminders = await prisma.reminder.findMany({
    include: { product: { select: { warrantyExpiry: true } } },
  });

  const toFlag: string[] = [];
  for (const r of reminders) {
    if (r.isDefault) continue;
    const slots = DEFAULT_REMINDER_DAYS.map((days) => {
      const d = new Date(r.product.warrantyExpiry);
      d.setDate(d.getDate() - days);
      d.setHours(8, 0, 0, 0);
      return d.getTime();
    });
    if (slots.includes(new Date(r.remindAt).getTime())) {
      toFlag.push(r.id);
    }
  }

  if (toFlag.length > 0) {
    await prisma.reminder.updateMany({
      where: { id: { in: toFlag } },
      data: { isDefault: true },
    });
  }
  console.log(`Flagged ${toFlag.length} default reminder(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
