import { Router } from "express";
import { login, me, register } from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticateRequest } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(register));
authRoutes.post("/login", asyncHandler(login));
authRoutes.get("/me", authenticateRequest, asyncHandler(me));
