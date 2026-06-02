import { Router } from "express";
import { verifyJWT } from "../middlewares/auth";
import {
  getAllReminders,
  createReminder,
  deleteReminder,
  getUserReminders,
  markReminderRead,
} from "../controllers/reminder.controller";
import { createReminderSchema } from "../schemas/reminder.schema";
import { productIdParamSchema, reminderIdParamSchema } from "../schemas/common.schema";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.use(verifyJWT);

router.get("/", getUserReminders);
router.get("/product/:productId", validateRequest(productIdParamSchema, "params"), getAllReminders);
router.post("/product/:productId", validateRequest(productIdParamSchema, "params"), validateRequest(createReminderSchema, "body"), createReminder);
router.patch("/:id/read", validateRequest(reminderIdParamSchema, "params"), markReminderRead);
router.delete("/:id", validateRequest(reminderIdParamSchema, "params"), deleteReminder);

export default router;
