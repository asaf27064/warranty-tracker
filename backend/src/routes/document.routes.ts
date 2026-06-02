import { Router } from "express";
import multer from "multer";
import { verifyJWT } from "../middlewares/auth";
import {
  getAllDocs,
  uploadDoc,
  deleteDoc,
} from "../controllers/document.controller";
import { validateRequest } from "../middlewares/validate";
import { idParamSchema, productIdParamSchema } from "../schemas/common.schema";
import { uploadDocSchema } from "../schemas/document.schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.use(verifyJWT);

router.get(
  "/product/:productId",
  validateRequest(productIdParamSchema, "params"),
  getAllDocs,
);
router.post(
  "/product/:productId",
  validateRequest(productIdParamSchema, "params"),
  upload.single("file"),
  validateRequest(uploadDocSchema, "body"),
  uploadDoc,
);
router.delete("/:id", validateRequest(idParamSchema, "params"), deleteDoc);

export default router;
