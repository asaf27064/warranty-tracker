import { parseProductMessage } from "../services/productParser";

describe("parseProductMessage", () => {
  it("parses an add with a year warranty", () => {
    const result = parseProductMessage("I bought a MacBook, 2 year warranty");
    expect(result).not.toBeNull();
    expect(result?.warrantyMonths).toBe(24);
    expect(result?.category).toBe("ELECTRONICS");
    expect(result?.name.toLowerCase()).toContain("macbook");
  });

  it("parses a warranty given in months", () => {
    const result = parseProductMessage("bought a kettle with 6 months warranty");
    expect(result?.warrantyMonths).toBe(6);
  });

  it("extracts the store", () => {
    const result = parseProductMessage(
      "bought a TV from Best Buy, 1 year warranty",
    );
    expect(result?.store).toMatch(/best/i);
  });

  it("ignores questions", () => {
    expect(parseProductMessage("what is expiring soon?")).toBeNull();
  });

  it("ignores messages without a warranty mention", () => {
    expect(parseProductMessage("I bought a laptop yesterday")).toBeNull();
  });
});
