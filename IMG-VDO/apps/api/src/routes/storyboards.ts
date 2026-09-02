import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createStoryboardSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

// GET /api/storyboards
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const storyboards = await prisma.storyboard.findMany({
      where: { userId },
      include: {
        characters: true,
        scenes: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(storyboards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storyboards' });
  }
});

// POST /api/storyboards
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = createStoryboardSchema.parse(req.body);

    const storyboard = await prisma.storyboard.create({
      data: {
        ...data,
        userId,
      },
    });

    res.status(201).json(storyboard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create storyboard' });
  }
});

// GET /api/storyboards/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const storyboard = await prisma.storyboard.findUnique({
      where: { id },
      include: {
        characters: true,
        scenes: {
          include: {
            characters: {
              include: {
                character: true,
              },
            },
          },
        },
      },
    });

    if (!storyboard || storyboard.userId !== userId) {
      return res.status(404).json({ error: 'Storyboard not found' });
    }

    res.json(storyboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storyboard' });
  }
});

// PUT /api/storyboards/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const data = createStoryboardSchema.partial().parse(req.body);

    const storyboard = await prisma.storyboard.findUnique({
      where: { id },
    });

    if (!storyboard || storyboard.userId !== userId) {
      return res.status(404).json({ error: 'Storyboard not found' });
    }

    const updated = await prisma.storyboard.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update storyboard' });
  }
});

// DELETE /api/storyboards/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const storyboard = await prisma.storyboard.findUnique({
      where: { id },
    });

    if (!storyboard || storyboard.userId !== userId) {
      return res.status(404).json({ error: 'Storyboard not found' });
    }

    await prisma.storyboard.delete({
      where: { id },
    });

    res.json({ message: 'Storyboard deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete storyboard' });
  }
});

export default router;
