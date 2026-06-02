import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid(),
});

export const reminderIdParamSchema = z.object({
  id: z.string().uuid(),
});

