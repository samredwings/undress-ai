import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  analyzeImageForStory,
  generateStoryFromImageAnalyses,
  generateText,
  analyzeImageForStoryBangla,
  generateBanglaStoryFromImageAnalyses,
} from "../utils/ai-provider";

const router = Router();
const prisma = new PrismaClient();

type StoryAsset = {
  id: string;
  url: string;
  label: string | null;
  description: string | null;
  assetType: string;
};

// ─── Validation Schemas ────────────────────────────────────────────────────────

const buildStorySchema = z.object({
  title: z.string().min(1).max(500),
  assetIds: z.array(z.string()).min(1).max(50),
  genre: z.enum([
    "ROMANCE",
    "FANTASY",
    "SCI_FI",
    "DRAMA",
    "MYSTERY",
    "ADVENTURE",
    "EROTICA",
    "THRILLER",
    "HORROR",
    "COMEDY",
    "OTHER",
    "BANGLA_INCEST_CHOTI",
  ]),
  contentRating: z
    .enum(["G", "PG", "PG_13", "R", "NC_17", "X", "XXX"])
    .default("XXX"),
  intimacyLevel: z.number().min(1).max(10).default(7),
  storyDirection: z.string().optional(),
  includeActType: z.string().optional(),
  characterDescriptions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createScenes: z.boolean().default(true),
  sceneDuration: z.number().default(5),
  language: z.enum(["ENGLISH", "BANGLA"]).optional(),
  chotiMode: z.boolean().optional(),
});

// ─── POST /api/stories/build-from-images ───────────────────────────────────────

router.post("/build-from-images", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = buildStorySchema.parse(req.body);

    // 1. Fetch all media assets and verify ownership
    const assets: StoryAsset[] = await prisma.mediaAsset.findMany({
      where: {
        id: { in: data.assetIds },
        userId,
      },
      orderBy: [{ sceneOrder: "asc" }, { createdAt: "asc" }],
    });

    if (assets.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid media assets found. Upload images first." });
    }

    if (assets.length !== data.assetIds.length) {
      return res.status(400).json({
        error:
          "Some media assets were not found. They may have been deleted or belong to another user.",
        foundCount: assets.length,
        requestedCount: data.assetIds.length,
      });
    }

    // Send initial progress
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    const sendProgress = (step: string, progress: number, message: string) => {
      res.write(
        JSON.stringify({
          type: "progress",
          step,
          progress,
          message,
          timestamp: new Date().toISOString(),
        }) + "\n",
      );
    };

    sendProgress("analyzing", 10, "Analyzing uploaded images...");

    // 2. Analyze each image for story context
    const analyses = [];
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      try {
        const analysis = await analyzeImageForStory(
          asset.url,
          asset.description || undefined,
        );
        analyses.push({
          imageUrl: asset.url,
          label: asset.label || `Scene ${i + 1}`,
          description: analysis.description,
          characters: analysis.characters,
          setting: analysis.setting,
          mood: analysis.mood,
          assetId: asset.id,
        });
        sendProgress(
          "analyzing",
          10 + Math.round(((i + 1) / assets.length) * 30),
          `Analyzed image ${i + 1}: ${asset.label || `Image ${i + 1}`}`,
        );
      } catch (error) {
        console.warn(
          `Failed to analyze asset ${asset.id}, using fallback:`,
          error,
        );
        analyses.push({
          imageUrl: asset.url,
          label: asset.label || `Scene ${i + 1}`,
          description: asset.description || `A scene from the story`,
          characters: [],
          setting: "Unknown",
          mood: "Neutral",
          assetId: asset.id,
        });
      }
    }

    sendProgress("writing", 45, "Weaving images into a cohesive story...");

    // 3. Generate the story from analyzed images
    const isBanglaChoti =
      data.genre === "BANGLA_INCEST_CHOTI" ||
      data.language === "BANGLA" ||
      data.chotiMode;

    let storyContent: string;
    if (isBanglaChoti) {
      // Re-analyze images with Bangla context (or use existing English analyses if they're already rich enough)
      // For best results, re-analyze with Bangla prompts
      const banglaAnalyses = analyses.map((a, i) => ({
        imageUrl: a.imageUrl,
        label: a.label || `Scene ${i + 1}`,
        description: a.description,
        characters: a.characters,
        setting: a.setting,
        mood: a.mood,
      }));

      storyContent = await generateBanglaStoryFromImageAnalyses(
        banglaAnalyses,
        {
          genre: data.genre,
          intimacyLevel: data.intimacyLevel,
          includeActType: data.includeActType,
          storyDirection: data.storyDirection,
          characterDescriptions: data.characterDescriptions,
        },
      );
    } else {
      storyContent = await generateStoryFromImageAnalyses(analyses, {
        genre: data.genre,
        intimacyLevel: data.intimacyLevel,
        includeActType: data.includeActType,
        storyDirection: data.storyDirection,
        characterDescriptions: data.characterDescriptions,
      });
    }

    sendProgress("saving", 75, "Saving your story...");

    // 4. Save the story
    const story = await prisma.story.create({
      data: {
        title: data.title,
        prompt: `Story built from ${assets.length} images. Genre: ${data.genre}. Intimacy level: ${data.intimacyLevel}/10.`,
        content: storyContent,
        genre: data.genre as any,
        contentRating: data.contentRating as any,
        characters: [],
        tags: data.tags || [],
        userId,
        nsfwScore: 1.0,
        nsfwFlagged: false,
      },
    });

    // Link media assets to the story
    await Promise.all(
      assets.map((asset, idx) =>
        prisma.mediaAsset.update({
          where: { id: asset.id },
          data: {
            storyId: story.id,
            sceneOrder: idx + 1,
          },
        }),
      ),
    );

    // 5. Optionally generate scenes
    let scenes: any[] = [];
    if (data.createScenes) {
      sendProgress("scenes", 85, "Generating video scenes from story...");

      scenes = await generateScenesFromStory(
        story.id,
        storyContent,
        analyses,
        data,
      );
    }

    sendProgress("complete", 100, "Story created successfully!");

    // 6. Final response
    res.write(
      JSON.stringify({
        type: "complete",
        story,
        scenes,
        mediaAssets: assets.map((a) => ({
          id: a.id,
          url: a.url,
          label: a.label,
          assetType: a.assetType,
        })),
        analysisCount: analyses.length,
        intimacyLevel: data.intimacyLevel,
        timestamp: new Date().toISOString(),
      }) + "\n",
    );

    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Can't use chunked response for validation errors, send as JSON
      return res.status(400).json({ error: error.errors });
    }
    console.error("Build story from images error:", error);
    res.status(500).json({ error: "Failed to build story from images" });
  }
});

// ─── POST /api/stories/reorder-assets ─────────────────────────────────────────

router.post("/reorder-assets", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { assetIds } = z
      .object({
        assetIds: z.array(z.string()),
      })
      .parse(req.body);

    // Update scene order based on array position
    await Promise.all(
      assetIds.map((id, index) =>
        prisma.mediaAsset.updateMany({
          where: { id, userId },
          data: { sceneOrder: index + 1 },
        }),
      ),
    );

    res.json({ success: true, message: "Assets reordered" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to reorder assets" });
  }
});

// ─── POST /api/stories/build-from-images/simple (no streaming) ────────────────

router.post(
  "/build-from-images/simple",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const data = buildStorySchema.parse(req.body);

      // Fetch assets
      const assets: StoryAsset[] = await prisma.mediaAsset.findMany({
        where: {
          id: { in: data.assetIds },
          userId,
        },
        orderBy: [{ sceneOrder: "asc" }, { createdAt: "asc" }],
      });

      if (assets.length === 0) {
        return res
          .status(400)
          .json({ error: "No valid media assets found. Upload images first." });
      }

      // Analyze images
      const analyses = [];
      for (const asset of assets) {
        try {
          const analysis = await analyzeImageForStory(
            asset.url,
            asset.description || undefined,
          );
          analyses.push({
            imageUrl: asset.url,
            label: asset.label || `Scene`,
            description: analysis.description,
            characters: analysis.characters,
            setting: analysis.setting,
            mood: analysis.mood,
            assetId: asset.id,
          });
        } catch {
          analyses.push({
            imageUrl: asset.url,
            label: asset.label || `Scene`,
            description: asset.description || `A scene from the story`,
            characters: [],
            setting: "Unknown",
            mood: "Neutral",
            assetId: asset.id,
          });
        }
      }

      // Generate story
      const isBanglaChoti =
        data.genre === "BANGLA_INCEST_CHOTI" ||
        data.language === "BANGLA" ||
        data.chotiMode;

      let storyContent: string;
      if (isBanglaChoti) {
        storyContent = await generateBanglaStoryFromImageAnalyses(analyses, {
          genre: data.genre,
          intimacyLevel: data.intimacyLevel,
          includeActType: data.includeActType,
          storyDirection: data.storyDirection,
          characterDescriptions: data.characterDescriptions,
        });
      } else {
        storyContent = await generateStoryFromImageAnalyses(analyses, {
          genre: data.genre,
          intimacyLevel: data.intimacyLevel,
          includeActType: data.includeActType,
          storyDirection: data.storyDirection,
          characterDescriptions: data.characterDescriptions,
        });
      }

      // Save story
      const story = await prisma.story.create({
        data: {
          title: data.title,
          prompt: `Story built from ${assets.length} images. Genre: ${data.genre}. Intimacy level: ${data.intimacyLevel}/10.`,
          content: storyContent,
          genre: data.genre as any,
          contentRating: data.contentRating as any,
          characters: [],
          tags: data.tags || [],
          userId,
          nsfwScore: 1.0,
          nsfwFlagged: false,
        },
      });

      // Link assets
      await Promise.all(
        assets.map((asset, idx) =>
          prisma.mediaAsset.update({
            where: { id: asset.id },
            data: {
              storyId: story.id,
              sceneOrder: idx + 1,
            },
          }),
        ),
      );

      // Generate scenes
      let scenes: any[] = [];
      if (data.createScenes) {
        scenes = await generateScenesFromStory(
          story.id,
          storyContent,
          analyses,
          data,
        );
      }

      res.json({
        success: true,
        story,
        scenes,
        mediaAssetCount: assets.length,
        intimacyLevel: data.intimacyLevel,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Build story from images error:", error);
      res.status(500).json({ error: "Failed to build story from images" });
    }
  },
);

// ─── Helper: Generate scenes from story ───────────────────────────────────────

async function generateScenesFromStory(
  storyId: string,
  storyContent: string,
  analyses: Array<{
    imageUrl: string;
    label: string;
    description: string;
    characters: string[];
    setting: string;
    mood: string;
  }>,
  options: any,
): Promise<any[]> {
  const scenes = [];

  // If we have image analyses, create a scene per image
  for (let i = 0; i < analyses.length; i++) {
    const analysis = analyses[i];

    // Generate a scene-specific prompt using AI
    let scenePrompt = analysis.description;
    try {
      const promptResult = await generateText({
        prompt: `Create a vivid video generation prompt for this scene (for AI video generation from image). Include sensual/intimate visual details:
Scene: ${analysis.description}
Mood: ${analysis.mood}
Setting: ${analysis.setting}
Characters: ${analysis.characters.join(", ")}

Generate a single detailed prompt (2-3 sentences) for AI video generation that captures the sensual essence of this scene.`,
        systemPrompt:
          "You create vivid video generation prompts. Be explicit and detailed.",
        maxTokens: 500,
        temperature: 0.8,
      });
      scenePrompt = promptResult.content.trim();
    } catch {
      scenePrompt = analysis.description.substring(0, 500);
    }

    const scene = await prisma.scene.create({
      data: {
        title: analysis.label || `Scene ${i + 1}`,
        description: analysis.description.substring(0, 1000),
        sceneNumber: i + 1,
        storyId,
        imageUrl: analysis.imageUrl,
        prompt: scenePrompt,
        motionStrength: options.motionIntensity || 0.7,
        duration: options.sceneDuration || 5,
        status: "PENDING",
      },
    });

    scenes.push(scene);
  }

  return scenes;
}

export default router;
