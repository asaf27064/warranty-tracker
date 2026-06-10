import { Router } from "express";
import { verifyJWT } from "../middlewares/auth";

import { extractProduct, chat } from "../controllers/ai.controller";
import { validateRequest } from "../middlewares/validate";
import { extractProductSchema, chatSchema } from "../schemas/ai.schema";
import { aiRateLimit } from "../middlewares/aiRateLimit";

const router = Router();
router.use(verifyJWT);
router.use(aiRateLimit);

router.post(
  "/extract-product",
  validateRequest(extractProductSchema, "body"),
  extractProduct,
);

router.post("/chat", validateRequest(chatSchema, "body"), chat);

export default router;
