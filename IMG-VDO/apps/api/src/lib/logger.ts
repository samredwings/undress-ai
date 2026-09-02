import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (config.isProduction ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.api_key",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
});

