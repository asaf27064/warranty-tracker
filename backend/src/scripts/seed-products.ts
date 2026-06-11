import prisma from "../config/db";
import { getWarrantyStatus } from "../utils/getWarrantyStatus";

const USER_ID = "85189829-6716-4f02-9efe-539f79037248";
const COUNT = 2000;

const categories = [
  "ELECTRONICS",
  "HOME_KITCHEN",
  "PHONES",
  "JEWELRY",
  "KIDS_TOYS",
  "APPLIANCES",
  "FURNITURE",
  "FASHION",
  "AUTOMOTIVE",
  "SPORTS",
  "TOOLS",
  "OTHER",
] as const;

const brands = [
  "Samsung",
  "Sony",
  "LG",
  "Bosch",
  "Apple",
  "Dell",
  "HP",
  "Dyson",
  "Philips",
  "Nike",
];
const items = [
  "TV",
  "Laptop",
  "Phone",
  "Fridge",
  "Drill",
  "Watch",
  "Headphones",
  "Vacuum",
  "Monitor",
  "Speaker",
];
const stores = ["Amazon", "KSP", "Best Buy", "Home Depot", "iStore", "Ivory"];

const rand = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const data = [];
  const now = Date.now();

  for (let i = 0; i < COUNT; i++) {
    // purchase date: random within the last ~3 years
    const daysAgo = Math.floor(Math.random() * 1095);
    const purchaseDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    const warrantyMonths = rand([6, 12, 24, 36, 48, 60]);
    const warrantyExpiry = new Date(purchaseDate);
    warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);

    data.push({
      name: `${rand(brands)} ${rand(items)} #${i + 1}`,
      store: rand(stores),
      userId: USER_ID,
      purchaseDate,
      warrantyExpiry,
      warrantyMonths,
      category: rand(categories),
      status: getWarrantyStatus(purchaseDate, warrantyExpiry),
    });
  }

  const start = Date.now();
  const result = await prisma.product.createMany({ data });
  console.log(
    `Inserted ${result.count} products in ${Date.now() - start}ms.`,
  );

  const total = await prisma.product.count({ where: { userId: USER_ID } });
  console.log(`User now has ${total} products total.`);

  await prisma.$disconnect();
}

main();
