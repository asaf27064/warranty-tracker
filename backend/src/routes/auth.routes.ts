import { Router } from "express";
import passport from "passport";
import {
  googleCallback,
  handleRefreshToken,
  handleLogout,
  getMe,
} from "../controllers/auth.controller";

import { verifyJWT } from "../middlewares/auth";

const router = Router();

router.get("/me", verifyJWT, getMe);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleCallback,
);
router.post("/refresh", handleRefreshToken);
router.post("/logout", handleLogout);

export default router;
