import prisma from "../config/db";
import { getWarrantyStatus } from "../utils/getWarrantyStatus";

// Diverse demo seed: varied products, statuses, edge cases, receipts and
// reminders, for one user (by email). It CLEARS the user's existing products
// first, so it is safe to re-run. Override the email with SEED_EMAIL.
//
// Run against whichever database holds that user, e.g. (PowerShell):
//   $env:DATABASE_URL="<your db url>"; npx tsx src/scripts/seed-diverse.ts

const EMAIL = process.env.SEED_EMAIL || "asaf27064@gmail.com";

type Category =
  | "NONE"
  | "ELECTRONICS"
  | "HOME_KITCHEN"
  | "PHONES"
  | "JEWELRY"
  | "KIDS_TOYS"
  | "APPLIANCES"
  | "FURNITURE"
  | "FASHION"
  | "AUTOMOTIVE"
  | "SPORTS"
  | "TOOLS"
  | "OTHER";

type DocType = "RECEIPT" | "INVOICE" | "WARRANTY_CERTIFICATE" | "PHOTO" | "OTHER";

type Doc = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  docType: DocType;
  fileSize: number;
};

type Seed = {
  name: string;
  store: string | null;
  category: Category;
  pic: string | null; // loremflickr keyword, or null for the icon fallback
  months: number; // warranty length
  exp: number; // days until expiry from now (negative = already expired)
  docs?: Doc[];
  reminders?: boolean; // default true
};

const photo = (kw: string, lock: number) =>
  `https://loremflickr.com/600/400/${kw.replace(/\s+/g, ",")}?lock=${lock}`;
const SAMPLE_PDF = "https://pdfobject.com/pdf/sample.pdf";

let lock = 1;
const recImg = (): Doc => ({
  fileName: "receipt.jpg",
  fileUrl: `https://loremflickr.com/700/950/receipt?lock=${lock++}`,
  mimeType: "image/jpeg",
  docType: "RECEIPT",
  fileSize: 240_000 + lock * 137,
});
const invPdf = (): Doc => ({
  fileName: "invoice.pdf",
  fileUrl: SAMPLE_PDF,
  mimeType: "application/pdf",
  docType: "INVOICE",
  fileSize: 53_402,
});
const warrantyPdf = (): Doc => ({
  fileName: "warranty-certificate.pdf",
  fileUrl: SAMPLE_PDF,
  mimeType: "application/pdf",
  docType: "WARRANTY_CERTIFICATE",
  fileSize: 61_988,
});
const productPhoto = (): Doc => ({
  fileName: "photo.jpg",
  fileUrl: `https://loremflickr.com/800/600/product?lock=${lock++}`,
  mimeType: "image/jpeg",
  docType: "PHOTO",
  fileSize: 412_004,
});

const seeds: Seed[] = [
  { name: 'MacBook Pro 16"', store: "Apple", category: "ELECTRONICS", pic: "macbook", months: 24, exp: 540, docs: [recImg(), invPdf(), warrantyPdf()] },
  { name: "iPhone 15 Pro", store: "iStore", category: "PHONES", pic: "iphone", months: 12, exp: 410, docs: [recImg()] },
  { name: "Samsung 4-Door Fridge", store: "KSP", category: "APPLIANCES", pic: "refrigerator", months: 36, exp: 18, docs: [recImg(), warrantyPdf()] },
  { name: "מקרר LG אינסטה-ויו", store: "חשמל דיל", category: "APPLIANCES", pic: "fridge", months: 24, exp: 130 },
  { name: "Dyson V15 Vacuum", store: "Amazon", category: "APPLIANCES", pic: null, months: 24, exp: 5, docs: [recImg()] },
  { name: "Sony WH-1000XM5", store: "Best Buy", category: "ELECTRONICS", pic: "headphones", months: 24, exp: -3, docs: [recImg()] },
  { name: "Bosch Hammer Drill", store: null, category: "TOOLS", pic: "drill", months: 36, exp: -60 },
  { name: "Nike Air Max 270", store: "Nike", category: "FASHION", pic: "sneakers", months: 6, exp: 80 },
  { name: "Diamond Engagement Ring", store: "Tiffany & Co.", category: "JEWELRY", pic: "diamond", months: 120, exp: 3400, docs: [invPdf(), warrantyPdf()] },
  { name: "LEGO Millennium Falcon", store: "Amazon", category: "KIDS_TOYS", pic: "lego", months: 1, exp: 12 },
  { name: "Super-Mega Ultra Premium 8K OLED Smart TV with Quantum Processor 2026 Limited Collector's Edition", store: "Ivory", category: "ELECTRONICS", pic: "tv", months: 24, exp: 300, docs: [recImg()] },
  { name: "Herman Miller Office Chair", store: "Amazon", category: "FURNITURE", pic: "chair", months: 60, exp: 620, docs: [invPdf()] },
  { name: "Trek Mountain Bike", store: "Decathlon", category: "SPORTS", pic: "bicycle", months: 24, exp: 14, docs: [recImg()] },
  { name: "Toyota Corolla", store: "Toyota", category: "AUTOMOTIVE", pic: "car", months: 60, exp: 1000, docs: [warrantyPdf()] },
  { name: "De'Longhi Coffee Machine", store: "KSP", category: "HOME_KITCHEN", pic: "coffee", months: 24, exp: 0, docs: [recImg()] },
  { name: "Breville Toaster", store: null, category: "HOME_KITCHEN", pic: null, months: 12, exp: 0 },
  { name: "Samsung Microwave", store: "Amazon", category: "APPLIANCES", pic: "microwave", months: 12, exp: 1 },
  { name: "Misc Gadget", store: null, category: "OTHER", pic: null, months: 12, exp: 60 },
  { name: "Apple Watch Ultra", store: "iStore", category: "ELECTRONICS", pic: "smartwatch", months: 24, exp: 250, docs: [recImg(), invPdf(), warrantyPdf(), productPhoto()] },
  { name: "Fender Stratocaster Guitar", store: "Amazon", category: "OTHER", pic: "guitar", months: 12, exp: 180, reminders: false },
  { name: "HP LaserJet Printer", store: "KSP", category: "ELECTRONICS", pic: "printer", months: 12, exp: 7, docs: [recImg()] },
  { name: "Café Espresso Machine (De'Longhi) — 50% off!", store: "Ivory", category: "HOME_KITCHEN", pic: "espresso", months: 24, exp: 200 },
  { name: "Patio Sofa Set", store: "IKEA", category: "FURNITURE", pic: "sofa", months: 36, exp: -400 },
  { name: "Garmin GPS Watch", store: "Decathlon", category: "SPORTS", pic: "watch", months: 24, exp: 95 },
];

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`No user found for ${EMAIL}. Sign in once in the app, then re-run.`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`Seeding for ${EMAIL} (${user.id}).`);

  const cleared = await prisma.product.deleteMany({ where: { userId: user.id } });
  console.log(`Cleared ${cleared.count} existing products (documents + reminders cascade).`);

  const now = Date.now();
  let docCount = 0;
  let reminderCount = 0;

  for (const s of seeds) {
    const warrantyExpiry = new Date();
    warrantyExpiry.setHours(23, 59, 0, 0);
    warrantyExpiry.setDate(warrantyExpiry.getDate() + s.exp);

    const purchaseDate = new Date(warrantyExpiry);
    purchaseDate.setMonth(purchaseDate.getMonth() - s.months);

    const product = await prisma.product.create({
      data: {
        name: s.name,
        store: s.store,
        userId: user.id,
        picture: s.pic ? photo(s.pic, seeds.indexOf(s) + 1) : null,
        purchaseDate,
        warrantyExpiry,
        warrantyMonths: s.months,
        category: s.category,
        status: getWarrantyStatus(purchaseDate, warrantyExpiry),
      },
    });

    if (s.docs?.length) {
      await prisma.document.createMany({
        data: s.docs.map((d, i) => ({
          productId: product.id,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          fileKey: `seed/${product.id}/${i}-${d.fileName}`,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          docType: d.docType,
        })),
      });
      docCount += s.docs.length;
    }

    if (s.reminders !== false) {
      // Mirror the app's real reminders (30/7/1 days before expiry).
      const leads = [30, 7, 1];
      const rows = leads.map((d) => {
        const remindAt = new Date(warrantyExpiry);
        remindAt.setDate(remindAt.getDate() - d);
        remindAt.setHours(8, 0, 0, 0);
        return { remindAt, past: remindAt.getTime() < now };
      });
      // Already-fired reminders are "sent". To avoid flooding the bell, mark
      // them read except the single most-recent one, and only if it fired
      // recently (so long-expired items don't show stale notifications).
      const RECENT_MS = 45 * 24 * 60 * 60 * 1000;
      const latestPast = Math.max(
        ...rows.filter((r) => r.past).map((r) => r.remindAt.getTime()),
        -Infinity,
      );
      const data = rows.map((r) => {
        const isRecentLatest =
          r.past &&
          r.remindAt.getTime() === latestPast &&
          now - r.remindAt.getTime() < RECENT_MS;
        return {
          productId: product.id,
          remindAt: r.remindAt,
          sent: r.past,
          sentAt: r.past ? new Date(r.remindAt) : null,
          isRead: r.past && !isRecentLatest,
        };
      });
      await prisma.reminder.createMany({ data });
      reminderCount += data.length;
    }
  }

  const total = await prisma.product.count({ where: { userId: user.id } });
  console.log(
    `Done. Seeded ${seeds.length} products, ${docCount} documents, ${reminderCount} reminders. User now has ${total} products.`,
  );
  await prisma.$disconnect();
}

main();
