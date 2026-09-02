import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clean up existing data
    await prisma.sceneCharacter.deleteMany();
    await prisma.generationJob.deleteMany();
    await prisma.scene.deleteMany();
    await prisma.story.deleteMany();
    await prisma.storyboard.deleteMany();
    await prisma.character.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.user.deleteMany();

    // Create demo user
    const hashedPassword = await bcryptjs.hash('password123', 10);
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@storybook.io',
        username: 'demo',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        role: 'CREATOR',
      },
    });

    console.log('✅ Database seeded successfully');
    console.log('Demo user created:', {
      email: demoUser.email,
      username: demoUser.username,
      password: 'password123',
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
