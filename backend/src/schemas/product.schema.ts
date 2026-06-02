import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  store: z.string().optional().nullable(),
  picture: z
    .string()
    .url({ error: "Picture must be a valid URL" })
    .optional()
    .nullable(),
  purchaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Purchase date must be a valid date string",
  }),
  warrantyMonths: z
    .number()
    .int()
    .positive({ error: "Warranty months must be a positive integer" }),
  category: z.enum(
    [
      "NONE",
      "ELECTRONICS",
      "HOME_KITCHEN",
      "PHONES",
      "JEWELRY",
      "KIDS_TOYS",
      "APPLIANCES",
      "FURNITURE",
      "FASHION",
      "AUTOMOTIVE",
      "SPORTS",
      "TOOLS",
      "OTHER",
    ],
    { error: "Invalid category" },
  ),
});

export const updateProductSchema = createProductSchema.partial();

export const getAllProductsQuerySchema = z.object({
  search: z.string().optional(),
});
