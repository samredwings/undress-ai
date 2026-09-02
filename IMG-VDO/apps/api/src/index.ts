import express from "express";
import cors from "cors";
import "express-async-errors";
import pinoHttp from "pino-http";
import { createClient } from "redis";

import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";

import authRoutes from "./routes/auth";
import storyboardRoutes from "./routes/storyboards";
import characterRoutes from "./routes/characters";
import storyRoutes from "./routes/stories";
import sceneRoutes from "./routes/scenes";
import dashboardRoutes from "./routes/dashboard";
import modelsRoutes from "./routes/models";
import creativeRoutes from "./routes/creative";
import videosRoutes from "./routes/videos";
import publishingRoutes from "./routes/publishing";
import roleplayRoutes from "./routes/roleplay";
import offlineRoutes from "./routes/offline";
import unrestrictedRoutes from "./routes/unrestricted";
import nsfwRoutes from "./routes/nsfw";
import userKeysRoutes from "./routes/user-keys";
import mediaAssetsRoutes from "./routes/media-assets";
import buildStoryRoutes from "./routes/build-story";
import sexGameRoutes from "./routes/sex-game";
import gdprRoutes from "./routes/gdpr";

const app = express();

// ─── Security & parsing middleware ───────────────────────────────────────

app.set("trust proxy", config.trustProxy);
app.disable("x-powered-by");
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    maxAge: 600,
  }),
);
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: config.bodyLimit }));
app.use(express.urlencoded({ limit: config.bodyLimit, extended: true }));

// Disable caching on auth responses
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// ─── Health check (real, with DB + Redis probe) ──────────────────────────

let redisCheck: ReturnType<typeof createClient> | null = null;
async function getRedis() {
  if (redisCheck) return redisCheck;
  redisCheck = createClient({ url: config.redis.url });
  redisCheck.on("error", (err) => logger.error({ err }, "redis"));
  await redisCheck.connect();
  return redisCheck;
}

app.get("/health", async (req, res) => {
  const result: Record<string, string> = { status: "ok", timestamp: new Date().toISOString() };
  try {
    await prisma.$queryRaw`SELECT 1`;
    result.database = "ok";
  } catch (err) {
    result.status = "degraded";
    result.database = "down";
  }
  try {
    const r = await getRedis();
    await r.ping();
    result.redis = "ok";
  } catch {
    result.status = "degraded";
    result.redis = "down";
  }
  res.status(result.status === "ok" ? 200 : 503).json(result);
});

// ─── Public routes ───────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/models", modelsRoutes);
app.use("/api/offline", offlineRoutes);

// ─── Protected routes ────────────────────────────────────────────────────

app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/storyboards", authMiddleware, storyboardRoutes);
app.use("/api/characters", authMiddleware, characterRoutes);
app.use("/api/stories", authMiddleware, storyRoutes);
app.use("/api/stories", authMiddleware, buildStoryRoutes);
app.use("/api/scenes", authMiddleware, sceneRoutes);
app.use("/api/creative", authMiddleware, creativeRoutes);
app.use("/api/videos", authMiddleware, videosRoutes);
app.use("/api/publish", authMiddleware, publishingRoutes);
app.use("/api/export", authMiddleware, publishingRoutes);
app.use("/api/roleplay", authMiddleware, roleplayRoutes);
app.use("/api/unrestricted", authMiddleware, unrestrictedRoutes);
app.use("/api/content", authMiddleware, nsfwRoutes);
app.use("/api/user/keys", authMiddleware, userKeysRoutes);
app.use("/api/media-assets", authMiddleware, mediaAssetsRoutes);
app.use("/api/sex-game", authMiddleware, sexGameRoutes);
app.use("/api/me", authMiddleware, gdprRoutes);

// ─── 404 + error handler ─────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});
app.use(errorHandler);

// ─── Bootstrap + graceful shutdown ──────────────────────────────────────

const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(
    { port: PORT, env: config.nodeEnv },
    `API listening on :${PORT}`,
  );
});

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(async () => {
    try {
      await prisma.$disconnect();
      if (redisCheck) await redisCheck.quit();
    } catch (err) {
      logger.error({ err }, "shutdown cleanup error");
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => {
  logger.error({ err }, "unhandled rejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception");
  shutdown("uncaughtException");
});

export default app;

