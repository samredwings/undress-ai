import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [storyboardCount, storyCount, characterCount, totalScenes] = await Promise.all([
      prisma.storyboard.count({ where: { userId } }),
      prisma.story.count({ where: { userId } }),
      prisma.character.count({ where: { userId } }),
      prisma.scene.count({
        where: {
          story: { userId },
        },
      }),
    ]);

    const recentStories = await prisma.story.findMany({
      where: { userId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        genre: true,
        status: true,
        updatedAt: true,
      },
    });

    const recentStoryboards = await prisma.storyboard.findMany({
      where: { userId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        thumbnail: true,
        updatedAt: true,
      },
    });

    res.json({
      stats: {
        storyboards: storyboardCount,
        stories: storyCount,
        characters: characterCount,
        totalScenes,
      },
      recentStories,
      recentStoryboards,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
