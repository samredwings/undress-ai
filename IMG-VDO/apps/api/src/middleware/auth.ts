import { Request, Response, NextFunction } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  user?: { id: string; role: string; status: string };
}

type Algorithm = "HS256" | "RS256";

function signingAlgorithm(): Algorithm {
  return config.jwtPrivateKey && config.jwtPublicKey ? "RS256" : "HS256";
}

export function signToken(userId: string, options?: SignOptions): string {
  const alg = signingAlgorithm();
  const expiresIn = (options?.expiresIn ?? config.jwtExpire) as SignOptions["expiresIn"];

  if (alg === "RS256") {
    if (!config.jwtPrivateKey) throw new Error("JWT private key is not configured");
    return jwt.sign({ userId }, config.jwtPrivateKey, {
      expiresIn,
      algorithm: "RS256",
    });
  }

  if (!config.jwtSecret) throw new Error("JWT secret is not configured");
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn,
    algorithm: "HS256",
  });
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const token = header.slice(7);
    if (!token || token.length > 1024) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Choose verification key/alg based on configured keys
    let decoded: { userId: string };
    if (config.jwtPublicKey && config.jwtPrivateKey) {
      decoded = jwt.verify(token, config.jwtPublicKey, { algorithms: ["RS256"] }) as { userId: string };
    } else {
      decoded = jwt.verify(token, config.jwtSecret as string, { algorithms: ["HS256"] }) as { userId: string };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
