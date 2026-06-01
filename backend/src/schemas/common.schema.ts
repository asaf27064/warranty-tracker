import { z } from "zod";

// Shared schemas reused across routes.
//
// TODO (you write this):
//   - idParamSchema: { id: string (uuid) }
//   - productIdParamSchema: { productId: string (uuid) }
//   (these validate req.params for the :id and :productId routes)

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid(),
});

export const reminderIdParamSchema = z.object({
  id: z.string().uuid(),
});

