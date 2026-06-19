import request from "supertest";
import app from "../app";
import { generateTestToken } from "./setup";
import prisma from "../config/db";

const agent = request(app);

let token: string;
let userId: string;
let productId: string;

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: "reminder-ep-test@test.com" },
    update: {},
    create: {
      email: "reminder-ep-test@test.com",
      name: "Reminder EP Test",
      googleId: "reminder-ep-google-id",
    },
  });
  userId = user.id;
  token = generateTestToken(user.id, user.email);
  const res = await agent
    .post("/api/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Reminder Product",
      category: "ELECTRONICS",
      purchaseDate: new Date().toISOString(),
      warrantyMonths: 24,
    });
  productId = res.body.id;
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("Reminder endpoints", () => {
  it("marks all reminders as read", async () => {
    const res = await agent
      .patch("/api/reminders/read-all")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const reminders = await prisma.reminder.findMany({ where: { productId } });
    expect(reminders.length).toBeGreaterThan(0);
    expect(reminders.every((r) => r.isRead)).toBe(true);
  });

  it("restores missing default reminders", async () => {
    await prisma.reminder.deleteMany({ where: { productId } });
    const res = await agent
      .post(`/api/reminders/product/${productId}/restore-defaults`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.created).toBeGreaterThan(0);
    const reminders = await prisma.reminder.findMany({ where: { productId } });
    expect(reminders.every((r) => r.isDefault)).toBe(true);
  });

  it("clears fired reminders but keeps upcoming ones", async () => {
    await prisma.reminder.deleteMany({ where: { productId } });
    await prisma.reminder.create({
      data: { productId, remindAt: new Date(Date.now() - 86_400_000) },
    });
    await prisma.reminder.create({
      data: { productId, remindAt: new Date(Date.now() + 86_400_000) },
    });

    const res = await agent
      .delete("/api/reminders/clear")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const remaining = await prisma.reminder.findMany({ where: { productId } });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].remindAt.getTime()).toBeGreaterThan(Date.now());
  });
});
