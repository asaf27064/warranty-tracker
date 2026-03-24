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
import { startReminderCron } from "./services/reminder.service";
import imageRoutes from "./routes/image.routes";

initializePassport();

const app = express();
const PORT = process.env.PORT;

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

startReminderCron();

app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});
