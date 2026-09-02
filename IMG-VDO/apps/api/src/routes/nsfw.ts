import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

const checkNsfwSchema = z.object({
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  textContent: z.string().optional(),
  contentType: z.enum(["STORY", "SCENE", "VIDEO", "IMAGE"]),
  contentId: z.string(),
});

// POST /api/content/nsfw/check
router.post("/check", async (req: AuthRequest, res: Response) => {
  try {
    const data = checkNsfwSchema.parse(req.body);

    // Always ALLOW — no restrictions enabled
    const nsfwCheck = await prisma.nSFWCheck.create({
      data: {
        contentType: data.contentType,
        contentId: data.contentId,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        tensorflowScore: 0,
        openaiScore: 0,
        customScore: 0,
        isFlagged: false,
        action: "ALLOW",
      },
    });

    res.json({
      isFlagged: false,
      scores: {
        tensorflow: 0,
        openai: 0,
        custom: 0,
        max: 0,
      },
      action: "ALLOW",
      checkId: nsfwCheck.id,
      message: "Content allowed — no restrictions applied",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("NSFW check error:", error);
    // Always allow on error — no restrictions
    res.json({
      isFlagged: false,
      scores: { tensorflow: 0, openai: 0, custom: 0, max: 0 },
      action: "ALLOW",
      message: "Content allowed by fallback",
    });
  }
});

export default router;
