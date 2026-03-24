import { Router } from "express";
import { verifyJWT } from "../middlewares/auth";
import { searchImages } from "../services/image.service";

const router = Router();

router.use(verifyJWT);

router.get("/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }
  const images = await searchImages(query);
  return res.json({ images });
});

export default router;