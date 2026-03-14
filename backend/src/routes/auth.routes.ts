import {Router} from "express";


const router = Router();

// GET /auth/google
router.get('/google',passport.authenticate("google", { scope: ["profile", "email"] }))
router.get('/google/callback',)


export default router;