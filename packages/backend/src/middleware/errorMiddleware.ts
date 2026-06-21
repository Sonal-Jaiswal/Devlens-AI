import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(request: Request, response: Response) {
  response.status(404).json({
    error: "NotFound",
    message: `Route ${request.method} ${request.originalUrl} not found`
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, request: Request, response: Response, next: NextFunction) {
  const message = error instanceof Error ? error.message : "Unknown server error";

  if (message === "DAILY_QUOTA_EXCEEDED") {
    response.status(429).json({
      error: "RateLimitExceeded",
      message: "Free plan daily question limit reached. Upgrade to continue."
    });
    return;
  }

  response.status(500).json({
    error: "InternalServerError",
    message
  });
}