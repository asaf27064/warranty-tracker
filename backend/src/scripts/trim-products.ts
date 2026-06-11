import prisma from "../config/db";

const USER_ID = "85189829-6716-4f02-9efe-539f79037248";
const KEEP = 50;

async function main() {
  const keep = await prisma.product.findMany({
    where: { userId: USER_ID },
    orderBy: { createdAt: "desc" },
    take: KEEP,
    select: { id: true },
  });
  const keepIds = keep.map((p) => p.id);

  const result = await prisma.product.deleteMany({
    where: { userId: USER_ID, id: { notIn: keepIds } },
  });

  const total = await prisma.product.count({ where: { userId: USER_ID } });
  console.log(`Deleted ${result.count} products. ${total} remaining.`);

  await prisma.$disconnect();
}

main();
