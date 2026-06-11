import prisma from "../config/db";
const USER_ID = "85189829-6716-4f02-9efe-539f79037248";
async function main() {
  const t = Date.now();
  const rows = await prisma.product.findMany({
    where: { userId: USER_ID },
    orderBy: { createdAt: "desc" },
  });
  const ms = Date.now() - t;
  const bytes = Buffer.byteLength(JSON.stringify(rows));
  console.log(`findMany returned ${rows.length} rows in ${ms}ms`);
  console.log(`JSON payload size: ${(bytes / 1024).toFixed(1)} KB`);
  await prisma.$disconnect();
}
main();
