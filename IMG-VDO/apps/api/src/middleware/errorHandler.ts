import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid request data",
      details: err.flatten().fieldErrors,
    });
  }

  const status = err.statusCode ?? 500;
  const message = status >= 500 ? "Internal server error" : err.message;

  logger.error(
    { err, path: req.path, method: req.method, status },
    "request failed",
  );

  const body: Record<string, unknown> = { error: message };
  if (err.code) body.code = err.code;
  if (err.details && status < 500) body.details = err.details;
  if (process.env.NODE_ENV !== "production" && status >= 500) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
};

