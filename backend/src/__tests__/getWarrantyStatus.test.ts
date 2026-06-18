import { getWarrantyStatus } from "../utils/getWarrantyStatus";

const purchase = new Date("2020-01-01");
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

describe("getWarrantyStatus", () => {
  it("is ACTIVE when expiry is well in the future", () => {
    expect(getWarrantyStatus(purchase, daysFromNow(200))).toBe("ACTIVE");
  });

  it("is EXPIRING_SOON within 30 days", () => {
    expect(getWarrantyStatus(purchase, daysFromNow(10))).toBe("EXPIRING_SOON");
  });

  it("treats an expiry today as expiring, not expired", () => {
    expect(getWarrantyStatus(purchase, daysFromNow(0))).toBe("EXPIRING_SOON");
  });

  it("is EXPIRED only once the expiry day has passed", () => {
    expect(getWarrantyStatus(purchase, daysFromNow(-1))).toBe("EXPIRED");
  });

  it("uses a 30-day expiring window boundary", () => {
    expect(getWarrantyStatus(purchase, daysFromNow(30))).toBe("EXPIRING_SOON");
    expect(getWarrantyStatus(purchase, daysFromNow(31))).toBe("ACTIVE");
  });
});
