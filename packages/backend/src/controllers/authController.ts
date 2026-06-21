import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User.js";
import { loginRequestSchema, registerRequestSchema } from "@devlens/shared";
import { signToken } from "../utils/jwt.js";

function buildAuthResponse(userId: string, email: string, plan: "free" | "pro") {
  return {
    user: {
      id: userId,
      email,
      plan
    },
    token: signToken({ userId, email, plan })
  };
}

export async function register(request: Request, response: Response) {
  const payload = registerRequestSchema.parse(request.body);
  const existing = await UserModel.findOne({ email: payload.email });
  if (existing) {
    response.status(409).json({ error: "Conflict", message: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await UserModel.create({
    email: payload.email,
    password: passwordHash,
    plan: "free"
  });

  response.status(201).json({ ok: true, data: buildAuthResponse(String(user._id), user.email, user.plan) });
}

export async function login(request: Request, response: Response) {
  const payload = loginRequestSchema.parse(request.body);
  const user = await UserModel.findOne({ email: payload.email });
  if (!user) {
    response.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  const matches = await bcrypt.compare(payload.password, user.password);
  if (!matches) {
    response.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  response.json({ ok: true, data: buildAuthResponse(String(user._id), user.email, user.plan) });
}

export async function me(request: Request & { user?: { userId: string; email: string; plan: "free" | "pro" } }, response: Response) {
  if (!request.user) {
    response.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
    return;
  }

  response.json({ ok: true, data: { user: request.user } });
}
