import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: {
        email: "demo@example.com",
        name: "Demo User",
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });
    
    console.log(`Created/updated user: ${user.name} (${user.email})`);
    
    return user;
  } catch (error) {
    console.error("Error creating demo user:", error);
    throw error;
  }
}

createDemoUser()
  .then(() => console.log("Done!"))
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
