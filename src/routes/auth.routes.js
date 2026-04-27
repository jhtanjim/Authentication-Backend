// src/routes/auth.routes.js

import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter = Router();
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5
});

// =============================
// AUTH ROUTES
// =============================

// REGISTER
authRouter.post("/register", authController.register);

// LOGIN (MISSING BEFORE)



authRouter.post("/login", loginLimiter, authController.login);
// GET ME
authRouter.get("/get-me", authMiddleware, authController.getMe);
// REFRESH TOKEN
authRouter.get("/refresh-token", authController.refreshToken);

// LOGOUT (single device)
authRouter.post("/logout", authController.logout);

// LOGOUT ALL DEVICES (IMPORTANT)
authRouter.post("/logout-all", authController.logoutAll);

export default authRouter;