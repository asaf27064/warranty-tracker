import app from "./app";
import prisma from "./config/db";
import { processReminders, startReminderCron } from "./services/reminder.service";
import { validateEnv } from "./config/env";

validateEnv();

const PORT = process.env.PORT;

startReminderCron();

app.get("/api/test/cron", async (req, res) => {
  await processReminders();
  res.json({ done: true });
});

const server = app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Log unexpected failures. On an uncaught exception the process state is no
// longer trustworthy, so exit and let the host (Render/Docker) restart a clean
// one rather than limping along in a corrupt state.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});