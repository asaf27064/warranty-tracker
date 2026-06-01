import { z } from "zod";

// Validation for reminder routes.
//
// POST /product/:productId  body: { daysBefore: number }
//   daysBefore -> int, positive (e.g. 1..3650)
//
// TODO (you write this):
//   - createReminderSchema  (body: { daysBefore })
//   (params :productId and :id are covered by common.schema.ts)

// body only — :productId is validated separately via productIdParamSchema
export const createReminderSchema = z.object({
  daysBefore: z
    .number()
    .int()
    .positive({ error: "Days before must be a positive integer" }),
});
