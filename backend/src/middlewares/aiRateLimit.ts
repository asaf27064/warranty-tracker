import rateLimit from "express-rate-limit";
import { Request } from "express";

export const aiRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 20, // max AI requests per user per day
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user!.id,
  message: {
    error: "Daily AI request limit reached. Please try again tomorrow.",
  },
});
