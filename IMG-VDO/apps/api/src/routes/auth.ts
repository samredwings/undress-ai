import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { AuthRequest, signToken } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

const PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

const registerSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username: letters, numbers, _ and - only"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128)
    .regex(
      PASSWORD_RE,
      "Password must contain upper, lower, digit and special char",
    ),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((d) => {
      const dob = new Date(d);
      if (Number.isNaN(dob.getTime())) return false;
      const ageMs = Date.now() - dob.getTime();
      const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
      return ageYears >= config.age.min;
    }, `You must be at least ${config.age.min} years old to register`),
  acceptedTerms: z
    .boolean()
    .refine((v) => v === true, "Terms must be accepted"),
  acceptedPrivacy: z
    .boolean()
    .refine((v) => v === true, "Privacy policy must be accepted"),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
  keyGenerator: (req) => `login:${req.ip ?? "anon"}`,
});

const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;

function recordFailure(key: string) {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || entry.lockedUntil < now) {
    failedAttempts.set(key, { count: 1, lockedUntil: 0 });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_MS;
  }
}

function isLocked(key: string): { locked: boolean; until: number } {
  const entry = failedAttempts.get(key);
  if (!entry) return { locked: false, until: 0 };
  if (entry.lockedUntil > Date.now()) {
    return { locked: true, until: entry.lockedUntil };
  }
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    failedAttempts.delete(key);
  }
  return { locked: false, until: 0 };
}

function clearFailures(key: string) {
  failedAttempts.delete(key);
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    if (config.age.requireVerification) {
      // Age already enforced by zod refine
    }
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
      select: { id: true, email: true, username: true },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: "Email or username already in use" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    const token = signToken(user.id);

    logger.info({ userId: user.id }, "user registered");

    res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid registration data",
        details: err.flatten().fieldErrors,
      });
    }
    logger.error({ err }, "registration error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const lockKey = `login:${data.email}`;
    const lock = isLocked(lockKey);
    if (lock.locked) {
      return res.status(429).json({
        error: "Account temporarily locked. Try again later.",
        retryAfter: Math.ceil((lock.until - Date.now()) / 1000),
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true,
        status: true,
      },
    });

    if (!user) {
      recordFailure(lockKey);
      // Use generic message — don't reveal whether email exists
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ error: "Account not active" });
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      recordFailure(lockKey);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    clearFailures(lockKey);

    const token = signToken(user.id);

    logger.info({ userId: user.id }, "user logged in");

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid login data" });
    }
    logger.error({ err }, "login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;

