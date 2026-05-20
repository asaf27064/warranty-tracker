import request from "supertest";
import app from "../app";
import { generateTestToken } from "./setup";
import prisma from "../config/db";

const agent = request(app);

let token: string;
let testUserId: string;

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: "test-image@test.com" },
    update: {},
    create: {
      email: "test-image@test.com",
      name: "Test Image User",
      googleId: "test-google-image",
    },
  });
  testUserId = user.id;
  token = generateTestToken(user.id, user.email);
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: testUserId } });
  await prisma.$disconnect();
});

describe("Image API", () => {
  it("should return 401 without auth token", async () => {
    const res = await agent.get("/api/images/search?q=test");
    expect(res.status).toBe(401);
  });

  it("should return 400 without query", async () => {
    const res = await agent
      .get("/api/images/search")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("should search images", async () => {
    const res = await agent
      .get("/api/images/search?q=iPhone")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("images");
    expect(Array.isArray(res.body.images)).toBe(true);
  });

  it("should upload an image", async () => {
    const res = await agent
      .post("/api/images/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("fake image data"), "test-image.png");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("url");
  });
});