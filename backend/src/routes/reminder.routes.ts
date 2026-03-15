import { Router } from "express";
import { verifyJWT } from "../middlewares/auth";
import {
  getAllReminders,
  createReminder,
  deleteReminder,
} from "../controllers/reminder.controller";

const router = Router();

router.use(verifyJWT);

router.get("/product/:productId", getAllReminders);
router.post("/product/:productId", createReminder);
router.delete("/:id", deleteReminder);

export default router;
