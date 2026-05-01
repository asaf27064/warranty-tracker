import { Router } from "express";
import { verifyJWT } from "../middlewares/auth";
import {
  getAllReminders,
  createReminder,
  deleteReminder,
  getUserReminders,
  markReminderRead,
} from "../controllers/reminder.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", getUserReminders);
router.get("/product/:productId", getAllReminders);
router.post("/product/:productId", createReminder);
router.patch("/:id/read", verifyJWT, markReminderRead);
router.delete("/:id", deleteReminder);

export default router;
