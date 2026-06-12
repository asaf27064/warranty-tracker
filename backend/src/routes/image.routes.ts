import { Router, Request } from "express";
import multer from "multer";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { verifyJWT } from "../middlewares/auth";
import { searchImages } from "../services/image.service";
import { r2Client, R2_BUCKET } from "../config/r2";
import {
  IMAGE_FILE_TYPES,
  safeOriginalName,
  validateUploadedFile,
} from "../utils/fileValidation";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const imageSearchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user!.id,
  message: { error: "Too many image searches. Please slow down." },
});

const MAX_QUERY_LENGTH = 100;

router.use(verifyJWT);

router.get("/search", imageSearchRateLimit, async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: "query is too long" });
  }
  const images = await searchImages(query);
  return res.json({ images });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const validation = validateUploadedFile(file, IMAGE_FILE_TYPES);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const fileKey = `products/${req.user!.id}/${crypto.randomUUID()}.${validation.extension}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: validation.mimeType,
        Metadata: { originalName: safeOriginalName(file.originalname) },
      }),
    );

    const fileUrl = `${process.env.PUBLIC_FILES_URL}/${fileKey}`;
    return res.json({ url: fileUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
