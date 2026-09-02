import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

const router = Router();

router.get("/export", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const [user, storyboards, characters, stories, mediaAssets, sceneData] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
          },
        }),
        prisma.storyboard.findMany({ where: { userId } }),
        prisma.character.findMany({ where: { userId } }),
        prisma.story.findMany({ where: { userId } }),
        prisma.mediaAsset.findMany({
          where: { userId },
          select: {
            id: true,
            url: true,
            assetType: true,
            label: true,
            description: true,
            createdAt: true,
          },
        }),
        prisma.scene.findMany({
          where: { story: { userId } },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            videoUrl: true,
            createdAt: true,
            storyId: true,
          },
        }),
      ]);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="user-export-${userId}-${Date.now()}.json"`,
    );
    res.setHeader("Content-Type", "application/json");

    res.json({
      exportedAt: new Date().toISOString(),
      user,
      storyboards,
      characters,
      stories,
      mediaAssets,
      scenes: sceneData,
    });
  } catch (err) {
    logger.error({ err, userId: req.userId }, "export failed");
    res.status(500).json({ error: "Export failed" });
  }
});

const deleteSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = deleteSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Not found" });

    await prisma.user.delete({ where: { id: userId } });

    logger.info({ userId }, "user account deleted (GDPR)");

    res.json({ success: true, deletedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid confirmation string" });
    }
    logger.error({ err, userId: req.userId }, "delete failed");
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;

