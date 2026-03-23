import { Router } from "express";
import multer from "multer";
import { verifyJWT } from "../middlewares/auth";
import {
  getAllDocs,
  uploadDoc,
  deleteDoc,
} from "../controllers/document.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.use(verifyJWT);

router.get("/product/:productId", getAllDocs);
router.post("/product/:productId", upload.single("file"), uploadDoc);
router.delete("/:id", deleteDoc);

export default router;
