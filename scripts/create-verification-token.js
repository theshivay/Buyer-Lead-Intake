import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Create a verification token that expires in 24 hours
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    const token = await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: 'test@example.com',
          token: 'test-token-123'
        }
      },
      update: {
        expires: expiry
      },
      create: {
        identifier: 'test@example.com',
        token: 'test-token-123',
        expires: expiry
      }
    });
    
    console.log('Verification token created or updated:', token);
    console.log('Magic link URL:', `http://localhost:3000/api/auth/callback/email?token=${token.token}&email=${encodeURIComponent(token.identifier)}`);
  } catch (error) {
    console.error('Error creating verification token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
