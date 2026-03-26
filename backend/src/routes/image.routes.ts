import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { verifyJWT } from "../middlewares/auth";
import { searchImages } from "../services/image.service";
import { r2Client, R2_BUCKET } from "../config/r2";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(verifyJWT);

router.get("/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }
  const images = await searchImages(query);
  return res.json({ images });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const ext = file.originalname.split(".").pop() || "bin";
  const fileKey = `products/${req.user!.id}/${crypto.randomUUID()}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  const fileUrl = `${process.env.PUBLIC_FILES_URL}/${fileKey}`;
  return res.json({ url: fileUrl });
});

export default router;
