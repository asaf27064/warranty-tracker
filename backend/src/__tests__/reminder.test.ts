import request from "supertest";
import app from "../app";
import { generateTestToken } from "./setup";
import prisma from "../config/db";

const agent = request(app);

let token: string;
let testUserId: string;
let testProductId: string;
let testReminderId: string;

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: "test-reminder@test.com" },
    update: {},
    create: {
      email: "test-reminder@test.com",
      name: "Test Reminder User",
      googleId: "test-google-reminder",
    },
  });
  testUserId = user.id;
  token = generateTestToken(user.id, user.email);

  const res = await agent
    .post("/api/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Reminder Test Product",
      category: "ELECTRONICS",
      purchaseDate: new Date().toISOString(),
      warrantyMonths: 12,
      store: "Test Store",
    });
  testProductId = res.body.id;
});

afterAll(async () => {
  await prisma.reminder.deleteMany({ where: { productId: testProductId } });
  await prisma.product.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } });
  await prisma.$disconnect();
});

describe("Reminder API", () => {
  it("should auto-create reminders with product", async () => {
    const res = await agent
      .get(`/api/reminders/product/${testProductId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should create a custom reminder", async () => {
    const res = await agent
      .post(`/api/reminders/product/${testProductId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ daysBefore: 14 });

    expect(res.status).toBe(201);
    expect(res.body.productId).toBe(testProductId);
    testReminderId = res.body.id;
  });

  it("should reject duplicate reminder", async () => {
    const res = await agent
      .post(`/api/reminders/product/${testProductId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ daysBefore: 14 });

    expect(res.status).toBe(409);
  });

  it("should get all user reminders", async () => {
    const res = await agent
      .get("/api/reminders")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should mark reminder as read", async () => {
    const res = await agent
      .patch(`/api/reminders/${testReminderId}/read`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("should delete a reminder", async () => {
    const res = await agent
      .delete(`/api/reminders/${testReminderId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});