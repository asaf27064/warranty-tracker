import request from "supertest";
import app from "../app";
import { generateTestToken } from "./setup";
import prisma from "../config/db";

const agent = request(app);

let token: string;
let testUserId: string;
let testProductId: string;

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: {},
    create: {
      email: "test@test.com",
      name: "Test User",
      googleId: "test-google-id",
    },
  });
  testUserId = user.id;
  token = generateTestToken(user.id, user.email);
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } });
  await prisma.$disconnect();
});

describe("Product API", () => {
  it("should return 401 without auth token", async () => {
    const res = await agent.get("/api/products");
    expect(res.status).toBe(401);
  });

  it("should create a product", async () => {
    const res = await agent
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test MacBook",
        category: "ELECTRONICS",
        purchaseDate: new Date().toISOString(),
        warrantyMonths: 12,
        store: "Apple Store",
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test MacBook");
    expect(res.body.status).toBe("ACTIVE");
    testProductId = res.body.id;
  });

  it("should get all products", async () => {
    const res = await agent
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty("nextCursor");
  });

  it("should get product by id", async () => {
    const res = await agent
      .get(`/api/products/${testProductId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test MacBook");
  });

  it("should update a product", async () => {
    const res = await agent
      .put(`/api/products/${testProductId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated MacBook" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated MacBook");
  });

  it("should delete a product", async () => {
    const res = await agent
      .delete(`/api/products/${testProductId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});