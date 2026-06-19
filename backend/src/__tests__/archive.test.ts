import request from "supertest";
import app from "../app";
import { generateTestToken } from "./setup";
import prisma from "../config/db";

const agent = request(app);

let token: string;
let userId: string;

const createProduct = async (name: string) => {
  const res = await agent
    .post("/api/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name,
      category: "ELECTRONICS",
      purchaseDate: new Date().toISOString(),
      warrantyMonths: 24,
    });
  return res.body.id as string;
};

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: "archive-test@test.com" },
    update: {},
    create: {
      email: "archive-test@test.com",
      name: "Archive Test",
      googleId: "archive-test-google-id",
    },
  });
  userId = user.id;
  token = generateTestToken(user.id, user.email);
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("Archive", () => {
  let keepId: string;
  let archiveId: string;

  it("archives a product and hides it from the default list", async () => {
    keepId = await createProduct("Keep me");
    archiveId = await createProduct("Archive me");

    const res = await agent
      .post("/api/products/archive")
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: [archiveId], archived: true });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);

    const list = await agent
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`);
    const ids = list.body.items.map((p: { id: string }) => p.id);
    expect(ids).toContain(keepId);
    expect(ids).not.toContain(archiveId);
  });

  it("shows archived products in the archived view", async () => {
    const res = await agent
      .get("/api/products?status=ARCHIVED")
      .set("Authorization", `Bearer ${token}`);
    const ids = res.body.items.map((p: { id: string }) => p.id);
    expect(ids).toContain(archiveId);
    expect(ids).not.toContain(keepId);
  });

  it("excludes archived products from the stats counts", async () => {
    const res = await agent
      .get("/api/products/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.archived).toBe(1);
    expect(res.body.total).toBe(1);
  });

  it("unarchives a product back into the default list", async () => {
    await agent
      .post("/api/products/archive")
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: [archiveId], archived: false });

    const list = await agent
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`);
    const ids = list.body.items.map((p: { id: string }) => p.id);
    expect(ids).toContain(archiveId);
  });
});
