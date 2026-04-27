// src/routes/auth.routes.js

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();


// =============================
// AUTH ROUTES
// =============================

// REGISTER
authRouter.post("/register", authController.register);

// LOGIN (MISSING BEFORE)
authRouter.post("/login", authController.login);

// GET ME
authRouter.get("/get-me", authController.getMe);

// REFRESH TOKEN
authRouter.get("/refresh-token", authController.refreshToken);

// LOGOUT (single device)
authRouter.post("/logout", authController.logout);

// LOGOUT ALL DEVICES (IMPORTANT)
authRouter.post("/logout-all", authController.logoutAll);

export default authRouter;