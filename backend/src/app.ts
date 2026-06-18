import dotenv from "dotenv";
dotenv.config();

import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import { initializePassport } from "./config/passport";
import { authRateLimit } from "./middlewares/rateLimit";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import documentRoutes from "./routes/document.routes";
import reminderRoutes from "./routes/reminder.routes";
import imageRoutes from "./routes/image.routes";
import aiRoutes from "./routes/ai.routes";

initializePassport();

const app = express();

// Behind a hosting proxy (Render/Vercel/etc.) so X-Forwarded-* headers are trusted.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Lightweight liveness check for uptime pingers (no auth, no DB).
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRateLimit, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/ai", aiRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
