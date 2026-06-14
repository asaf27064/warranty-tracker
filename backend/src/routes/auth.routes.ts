import { Router } from "express";
import passport from "passport";
import {
  googleCallback,
  handleRefreshToken,
  handleLogout,
  getMe,
  updatePreferences,
  deleteAccount,
} from "../controllers/auth.controller";

import { verifyJWT } from "../middlewares/auth";

const router = Router();

router.get("/me", verifyJWT, getMe);
router.patch("/preferences", verifyJWT, updatePreferences);
router.delete("/account", verifyJWT, deleteAccount);

router.get("/google", (req, res, next) => {
  const prompt = req.query.prompt === "select_account" ? "select_account" : undefined;
  const loginHint =
    typeof req.query.login_hint === "string" ? req.query.login_hint : undefined;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt,
    loginHint,
  } as never)(req, res, next);
});
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleCallback,
);
router.post("/refresh", handleRefreshToken);
router.post("/logout", handleLogout);

export default router;
