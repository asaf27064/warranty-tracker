import rateLimit from "express-rate-limit";

// Guards the auth endpoints (OAuth, refresh, logout, preferences) against
// brute-force and abuse. Keyed by IP since these run before authentication.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
