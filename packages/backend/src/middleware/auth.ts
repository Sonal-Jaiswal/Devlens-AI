import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
    plan: "free" | "pro";
  };
};

export function authenticateRequest(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    response.status(401).json({ error: "Unauthorized", message: "Missing bearer token" });
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    request.user = verifyToken(token);
    next();
  } catch {
    response.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}
