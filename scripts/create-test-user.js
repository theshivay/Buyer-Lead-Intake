import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.upsert({
      where: {
        email: 'test@example.com',
      },
      update: {
        name: 'Test User',
        role: 'ADMIN',
      },
      create: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
      },
    });
    
    console.log('Test user created or updated:', user);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
