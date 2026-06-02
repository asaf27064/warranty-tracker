import { z } from "zod";

export const createReminderSchema = z.object({
  daysBefore: z
    .number()
    .int()
    .positive({ error: "Days before must be a positive integer" }),
});
