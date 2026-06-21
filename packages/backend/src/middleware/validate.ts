import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export function validateBody(schema: ZodTypeAny) {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      response.status(400).json({
        error: "ValidationError",
        message: "Invalid request body",
        issues: result.error.flatten()
      });
      return;
    }

    request.body = result.data;
    next();
  };
}