import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import app from "../app";
import { generateTestToken } from "./setup";
import prisma from "../config/db";

const agent = request(app);
const hash = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

let userId: string;
let email: string;

const makeRefreshToken = async () => {
  const raw = jwt.sign(
    { userId, email, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" },
  );
  await prisma.refreshToken.create({
    data: {
      token: hash(raw),
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return raw;
};

beforeAll(async () => {
  const user = await prisma.user.upsert({
    where: { email: "auth-test@test.com" },
    update: {},
    create: {
      email: "auth-test@test.com",
      name: "Auth Test",
      googleId: "auth-test-google-id",
    },
  });
  userId = user.id;
  email = user.email;
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("Auth", () => {
  it("rejects /auth/me without a token", async () => {
    const res = await agent.get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the user from /auth/me with a valid token", async () => {
    const token = generateTestToken(userId, email);
    const res = await agent
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it("refreshes the access token and rotates the refresh token", async () => {
    const raw = await makeRefreshToken();
    const res = await agent.post("/auth/refresh").set("Cookie", `jwt=${raw}`);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.headers["set-cookie"]).toBeDefined();

    // The used token is single-use: replaying it now fails.
    const reuse = await agent.post("/auth/refresh").set("Cookie", `jwt=${raw}`);
    expect(reuse.status).toBe(403);
  });

  it("revokes every session when a rotated token is replayed", async () => {
    const raw = await makeRefreshToken();
    const other = await makeRefreshToken();
    await agent.post("/auth/refresh").set("Cookie", `jwt=${raw}`); // rotates raw

    const replay = await agent.post("/auth/refresh").set("Cookie", `jwt=${raw}`);
    expect(replay.status).toBe(403);

    // Reuse detection should have wiped the user's other sessions too.
    const otherRes = await agent
      .post("/auth/refresh")
      .set("Cookie", `jwt=${other}`);
    expect(otherRes.status).toBe(403);
  });

  it("logs out and deletes the stored token", async () => {
    const raw = await makeRefreshToken();
    const res = await agent.post("/auth/logout").set("Cookie", `jwt=${raw}`);
    expect(res.status).toBe(200);
    const after = await prisma.refreshToken.findUnique({
      where: { token: hash(raw) },
    });
    expect(after).toBeNull();
  });
});
