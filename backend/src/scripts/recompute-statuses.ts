import "dotenv/config";
import prisma from "../config/db";
import { getWarrantyStatus } from "../utils/getWarrantyStatus";

// One-off: recompute every product's status against the current rules.
async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, purchaseDate: true, warrantyExpiry: true, status: true },
  });

  let changed = 0;
  for (const p of products) {
    const status = getWarrantyStatus(p.purchaseDate, p.warrantyExpiry);
    if (status !== p.status) {
      await prisma.product.update({ where: { id: p.id }, data: { status } });
      changed += 1;
    }
  }
  console.log(`Recomputed ${products.length} products, updated ${changed}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
