import request from "supertest";

// Object storage is mocked: the suite tests controller logic and DB writes, not
// the real R2 upload, so it runs without storage credentials.
jest.mock("../config/r2", () => ({
  r2Client: { send: jest.fn().mockResolvedValue({}) },
  R2_BUCKET: "test-bucket",
}));

import app from "../app";
import { generateTestToken } from "./setup";
import prisma from "../config/db";
import path from "path";

const agent = request(app);

let token: string;
let testUserId: string;
let testProductId: string;
let testDocId: string;

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: "test-doc@test.com" },
    update: {},
    create: {
      email: "test-doc@test.com",
      name: "Test Doc User",
      googleId: "test-google-doc",
    },
  });
  testUserId = user.id;
  token = generateTestToken(user.id, user.email);

  const res = await agent
    .post("/api/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Doc Test Product",
      category: "ELECTRONICS",
      purchaseDate: new Date().toISOString(),
      warrantyMonths: 12,
    });
  testProductId = res.body.id;
});

afterAll(async () => {
  await prisma.document.deleteMany({ where: { productId: testProductId } });
  await prisma.reminder.deleteMany({ where: { productId: testProductId } });
  await prisma.product.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } });
  await prisma.$disconnect();
});

describe("Document API", () => {
  it("should return 401 without auth token", async () => {
    const res = await agent.get(`/api/documents/product/${testProductId}`);
    expect(res.status).toBe(401);
  });

  it("should return empty documents for new product", async () => {
    const res = await agent
      .get(`/api/documents/product/${testProductId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should upload a document", async () => {
    const res = await agent
      .post(`/api/documents/product/${testProductId}`)
      .set("Authorization", `Bearer ${token}`)
      .field("docType", "RECEIPT")
      .attach(
        "file",
        Buffer.from("%PDF-1.4 test document content"),
        "test-receipt.pdf",
      );

    expect(res.status).toBe(201);
    expect(res.body.fileName).toBe("test-receipt.pdf");
    expect(res.body.docType).toBe("RECEIPT");
    testDocId = res.body.id;
  });

  it("should get documents for product", async () => {
    const res = await agent
      .get(`/api/documents/product/${testProductId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should delete a document", async () => {
    const res = await agent
      .delete(`/api/documents/${testDocId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});