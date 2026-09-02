import { Router, Response } from "express";
import multer from "multer";
import { z } from "zod";
import path from "node:path";
import crypto from "node:crypto";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { isSafeUrl, fetchSafe } from "../lib/security";
import { logger } from "../lib/logger";
import { config } from "../config";

const router = Router();

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_BYTES = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Unsupported image type"));
    }
    cb(null, true);
  },
});

const remoteUrlSchema = z.object({
  url: z.string().url(),
  assetType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  label: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

const updateAssetSchema = z.object({
  label: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  sceneOrder: z.number().int().min(0).max(1000).optional(),
});

router.post("/", upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase().slice(0, 8) || ".bin";
      const safeName = `${crypto.randomUUID()}${ext}`;
      const buf = req.file.buffer;

      const asset = await prisma.mediaAsset.create({
        data: {
          url: `local://${safeName}`,
          assetType: "IMAGE",
          label: req.body.label?.slice(0, 200),
          description: req.body.description?.slice(0, 2000),
          mimeType: req.file.mimetype,
          sizeBytes: buf.length,
          storageKind: "LOCAL",
          userId,
        },
      });
      return res.status(201).json(asset);
    }

    if (req.body?.url) {
      const data = remoteUrlSchema.parse(req.body);

      if (!(await isSafeUrl(data.url))) {
        return res
          .status(400)
          .json({ error: "URL is not allowed (private network or invalid)" });
      }

      const buf = await fetchSafe(data.url, { maxBytes: MAX_BYTES });

      const asset = await prisma.mediaAsset.create({
        data: {
          url: data.url,
          assetType: data.assetType,
          label: data.label,
          description: data.description,
          sizeBytes: buf.length,
          storageKind: "REMOTE",
          userId,
        },
      });
      return res.status(201).json(asset);
    }

    return res.status(400).json({ error: "Provide a file or url" });
  } catch (err) {
    logger.error({ err, userId: req.userId }, "media asset upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const assets = await prisma.mediaAsset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(assets);
  } catch (err) {
    logger.error({ err }, "list assets failed");
    res.status(500).json({ error: "Failed to list assets" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: req.params.id },
    });
    if (!asset || asset.userId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = updateAssetSchema.parse(req.body);
    const existing = await prisma.mediaAsset.findUnique({
      where: { id: req.params.id },
    });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }
    const updated = await prisma.mediaAsset.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const existing = await prisma.mediaAsset.findUnique({
      where: { id: req.params.id },
    });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }
    await prisma.mediaAsset.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;

