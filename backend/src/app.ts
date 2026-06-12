import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import { initializePassport } from "./config/passport";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import documentRoutes from "./routes/document.routes";
import reminderRoutes from "./routes/reminder.routes";
import imageRoutes from "./routes/image.routes";
import aiRoutes from "./routes/ai.routes";

initializePassport();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/ai", aiRoutes);

export default app;
