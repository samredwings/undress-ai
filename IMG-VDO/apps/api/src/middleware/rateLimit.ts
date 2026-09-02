import rateLimit from "express-rate-limit";
import { config } from "../config";

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.max(5, Math.floor(config.rateLimit.max / 6)),
  standardHeaders: true,
  legacyHeaders: false,
});
