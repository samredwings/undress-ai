import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import {
  createSession,
  getSession,
  processAction,
  generateStartScene,
} from "../utils/sex-game-engine";
import { generateImage } from "../utils/ai-provider";

const prisma = new PrismaClient();

const router = Router();

// ─── Validation Schemas ─────────────────────────────────────────────────────

const startGameSchema = z.object({
  characterName: z.string().min(1).max(100).default("Your Partner"),
  characterId: z.string().optional(),
  relationshipType: z.string().max(100).optional(),
  scenario: z.string().max(500).optional(),
  language: z.enum(["ENGLISH", "BANGLA"]).optional().default("ENGLISH"),
  intensity: z.number().min(1).max(10).optional().default(7),
  generateImage: z.boolean().optional().default(false),
});

const actSchema = z.object({
  sessionId: z.string().min(1),
  choiceIndex: z.number().int().min(1).max(10),
  generateImage: z.boolean().optional().default(false),
});

// ─── POST /api/sex-game/start ───────────────────────────────────────────────
// Start a new sex game session

async function generateAndSaveSceneImage(
  description: string,
  userId: string,
  storyId?: string,
): Promise<string | undefined> {
  try {
    const imagePrompt = `A sensual erotic scene: ${description.substring(0, 500)}`;
    const imageResult = await generateImage({
      prompt: imagePrompt,
      numSteps: 25,
      guidanceScale: 7.5,
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        url: imageResult.imageBase64,
        assetType: "IMAGE",
        label: `Sex game scene - ${new Date().toLocaleString()}`,
        description: description.substring(0, 500),
        storyId: storyId || null,
        userId,
      },
    });

    return `/api/media-assets/${asset.id}`;
  } catch (err) {
    console.warn("Sex game image generation failed:", err);
    return undefined;
  }
}

router.post("/start", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = startGameSchema.parse(req.body);

    let characterName = data.characterName;
    let characterImageUrl: string | null = null;

    // If characterId provided, fetch character details from DB
    if (data.characterId) {
      const character = await prisma.character.findUnique({
        where: { id: data.characterId },
      });
      if (character && character.userId === userId) {
        characterName = character.name;
        characterImageUrl = character.imageUrl;
        // Use character description as backdrop for scenario
        if (!data.scenario && character.description) {
          data.scenario = `An intimate encounter with ${character.name}. ${character.description}`;
        }
      }
    }

    // Create session
    const session = await createSession(userId, {
      characterName,
      characterImageUrl: characterImageUrl || undefined,
      relationshipType: data.relationshipType || "partner",
      scenario: data.scenario || "A passionate evening together",
      language: data.language,
      intensity: data.intensity,
    });

    // Generate the opening scene
    const scene = await generateStartScene(session);

    // Optionally generate scene image
    if (data.generateImage) {
      const imageUrl = await generateAndSaveSceneImage(
        scene.description,
        userId,
      );
      scene.imageUrl = imageUrl;
    }

    res.json({
      success: true,
      sessionId: session.id,
      session: {
        characterName: session.characterName,
        characterImageUrl: session.characterImageUrl,
        relationshipType: session.relationshipType,
        scenario: session.scenario,
        language: session.language,
        intensity: session.intensity,
        createdAt: session.createdAt,
      },
      game: scene,
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Sex game start error:", error);
    res.status(500).json({ error: "Failed to start sex game" });
  }
});

// ─── POST /api/sex-game/act ────────────────────────────────────────────────
// Make a choice and advance the game

router.post("/act", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = actSchema.parse(req.body);

    const session = await getSession(data.sessionId);
    if (!session) {
      return res.status(404).json({
        error: "Session not found or expired. Please start a new game.",
      });
    }

    // Verify session belongs to this user
    if (session.userId !== userId) {
      return res.status(403).json({ error: "Not your session" });
    }

    const result = await processAction(data.sessionId, data.choiceIndex);

    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }

    // Optionally generate scene image
    if (data.generateImage && result.description) {
      const imageUrl = await generateAndSaveSceneImage(
        result.description,
        userId,
      );
      result.imageUrl = imageUrl;
    }

    res.json({
      success: true,
      sessionId: session.id,
      session: {
        characterName: session.characterName,
        characterImageUrl: session.characterImageUrl,
        relationshipType: session.relationshipType,
        scenario: session.scenario,
        language: session.language,
      },
      game: result,
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Sex game act error:", error);
    res.status(500).json({ error: "Failed to process action" });
  }
});

// ─── GET /api/sex-game/status/:sessionId ───────────────────────────────────
// Get current game state without generating new content

router.get("/status/:sessionId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId } = req.params;

    const session = await getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: "Session not found or expired. Please start a new game.",
      });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ error: "Not your session" });
    }

    // Reconstruct current view from history
    const lastEntry = session.history[session.history.length - 1];

    res.json({
      success: true,
      sessionId: session.id,
      session: {
        characterName: session.characterName,
        characterImageUrl: session.characterImageUrl,
        relationshipType: session.relationshipType,
        scenario: session.scenario,
        language: session.language,
        createdAt: session.createdAt,
      },
      game: {
        phase: session.phase,
        arousal: session.arousal,
        stamina: session.stamina,
        round: session.round,
        description: lastEntry?.description || "",
        choices: [],
        climaxAchieved: false,
        climaxCount: session.climaxCount,
        sessionComplete:
          session.phase === "AFTERCARE" &&
          session.round > session.history.length - 1,
      },
      history: session.history,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Sex game status error:", error);
    res.status(500).json({ error: "Failed to get session status" });
  }
});

export default router;
