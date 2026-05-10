import app from "./app";
import { processReminders, startReminderCron } from "./services/reminder.service";

const PORT = process.env.PORT;

startReminderCron();

app.get("/api/test/cron", async (req, res) => {
  await processReminders();
  res.json({ done: true });
});

app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});