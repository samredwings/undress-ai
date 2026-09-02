import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import RedisStore, { type RedisReply } from "rate-limit-redis";
import { createClient, type RedisClientType } from "redis";
import { config } from "../config";
import { logger } from "./logger";

let redisClient: RedisClientType | null = null;
let storeInstance: RedisStore | null = null;
let initPromise: Promise<RedisStore | null> | null = null;

async function getStore(): Promise<RedisStore | null> {
  if (storeInstance) return storeInstance;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      redisClient = createClient({ url: config.redis.url });
      redisClient.on("error", (err) => logger.error({ err }, "redis error"));
      await redisClient.connect();
      storeInstance = new RedisStore({
        sendCommand: (...args: string[]) =>
          redisClient!.sendCommand(args) as Promise<RedisReply>,
        prefix: "rl:",
      });
      return storeInstance;
    } catch (err) {
      logger.warn({ err }, "redis unavailable, using in-memory rate limit");
      return null;
    }
  })();
  return initPromise;
}

function makeLimiter(opts: {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
  store?: RedisStore | null;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: opts.message ?? "Too many requests" },
    store: opts.store ?? undefined,
    keyGenerator: (req) => `${opts.keyPrefix ?? "g"}:${req.ip ?? "anon"}`,
  });
}

// CommonJS output cannot use top-level await; use the in-memory store until
// Redis initialization is moved behind application startup.
const store: RedisStore | null = null;

export const globalLimiter: RateLimitRequestHandler = makeLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  keyPrefix: "g",
  store,
});

export const authLimiter: RateLimitRequestHandler = makeLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  keyPrefix: "auth",
  store,
});

export const loginLimiter: RateLimitRequestHandler = makeLimiter({
  windowMs: 15 * 60_000,
  max: 5,
  message: "Too many login attempts. Try again later.",
  keyPrefix: "login",
  store,
});

export const aiLimiter: RateLimitRequestHandler = makeLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "ai",
  store,
});

export const uploadLimiter: RateLimitRequestHandler = makeLimiter({
  windowMs: 60_000,
  max: 10,
  keyPrefix: "up",
  store,
});

