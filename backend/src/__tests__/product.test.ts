import request from "supertest";
import app from "../app";

describe("Product API", () => {
  it("should return 401 without auth token", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(401);
  });
});