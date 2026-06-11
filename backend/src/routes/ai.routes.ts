import { Router } from "express";
import multer from "multer";
import { verifyJWT } from "../middlewares/auth";

import {
  extractProduct,
  extractProductImage,
  chat,
} from "../controllers/ai.controller";
import { validateRequest } from "../middlewares/validate";
import { extractProductSchema, chatSchema } from "../schemas/ai.schema";
import { aiRateLimit } from "../middlewares/aiRateLimit";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(verifyJWT);
router.use(aiRateLimit);

router.post(
  "/extract-product",
  validateRequest(extractProductSchema, "body"),
  extractProduct,
);

router.post(
  "/extract-product-image",
  upload.single("file"),
  extractProductImage,
);

router.post("/chat", validateRequest(chatSchema, "body"), chat);

export default router;
