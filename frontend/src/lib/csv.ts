import type { Product } from "../types";
import { CategoryLabels, StatusLabels } from "../types";

const escape = (value: string) =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const COLUMNS: { header: string; get: (p: Product) => string }[] = [
  { header: "Name", get: (p) => p.name },
  { header: "Category", get: (p) => CategoryLabels[p.category] ?? p.category },
  { header: "Store", get: (p) => p.store ?? "" },
  {
    header: "Purchase Date",
    get: (p) => new Date(p.purchaseDate).toLocaleDateString(),
  },
  { header: "Warranty (months)", get: (p) => String(p.warrantyMonths) },
  {
    header: "Expiry",
    get: (p) => new Date(p.warrantyExpiry).toLocaleDateString(),
  },
  { header: "Status", get: (p) => StatusLabels[p.status] ?? p.status },
];

export const toCsv = (products: Product[]): string => {
  const header = COLUMNS.map((c) => c.header).join(",");
  const rows = products.map((p) =>
    COLUMNS.map((c) => escape(c.get(p))).join(","),
  );
  return [header, ...rows].join("\r\n");
};

export const downloadCsv = (filename: string, csv: string) => {
  // Prepend a BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
