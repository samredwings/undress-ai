import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createSceneSchema = z.object({
  storyId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  sceneNumber: z.number(),
  characterIds: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  prompt: z.string().optional(),
  motionStrength: z.number().default(0.7),
  duration: z.number().default(5),
});

// POST /api/scenes
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = createSceneSchema.parse(req.body);

    // Verify story ownership
    const story = await prisma.story.findUnique({
      where: { id: data.storyId },
    });

    if (!story || story.userId !== userId) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const scene = await prisma.scene.create({
      data: {
        title: data.title,
        description: data.description,
        sceneNumber: data.sceneNumber,
        storyId: data.storyId,
        imageUrl: data.imageUrl,
        prompt: data.prompt,
        motionStrength: data.motionStrength,
        duration: data.duration,
      },
    });

    // Add characters to scene
    if (data.characterIds && data.characterIds.length > 0) {
      await Promise.all(
        data.characterIds.map((characterId) =>
          prisma.sceneCharacter.create({
            data: {
              sceneId: scene.id,
              characterId,
            },
          })
        )
      );
    }

    res.status(201).json(scene);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

// GET /api/scenes/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const scene = await prisma.scene.findUnique({
      where: { id },
      include: {
        story: true,
        characters: {
          include: {
            character: true,
          },
        },
        generationJob: true,
      },
    });

    if (!scene || scene.story?.userId !== userId) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    res.json(scene);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scene' });
  }
});

export default router;
