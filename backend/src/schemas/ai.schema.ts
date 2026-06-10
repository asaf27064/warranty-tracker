import { z } from "zod";

export const extractProductSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});
