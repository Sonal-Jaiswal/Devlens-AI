import type { NextFunction, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import type { AuthenticatedRequest } from "./auth.js";

export function attachUserIfPresent(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    request.user = verifyToken(token);
  } catch {
    request.user = undefined;
  }

  next();
}
