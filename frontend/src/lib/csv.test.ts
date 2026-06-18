import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";
import type { Product } from "../types";

const product = (over: Partial<Product> = {}): Product => ({
  id: "1",
  name: "MacBook",
  category: "ELECTRONICS",
  store: "Apple",
  status: "ACTIVE",
  purchaseDate: "2025-01-01",
  warrantyExpiry: "2027-01-01",
  warrantyMonths: 24,
  archived: false,
  createdAt: "2025-01-01",
  updatedAt: "2025-01-01",
  ...over,
});

describe("toCsv", () => {
  it("writes a header row and one row per product", () => {
    const csv = toCsv([product(), product({ name: "Phone" })]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("Name");
    expect(lines).toHaveLength(3);
  });

  it("quotes and escapes values with commas, quotes or newlines", () => {
    const csv = toCsv([product({ name: 'Sofa, "deluxe"' })]);
    expect(csv).toContain('"Sofa, ""deluxe"""');
  });

  it("handles a missing store as an empty field", () => {
    const csv = toCsv([product({ store: undefined })]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain(",,");
  });
});
