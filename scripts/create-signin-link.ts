import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function createSignInToken() {
  // Get the demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@example.com" },
  });
  
  if (!demoUser) {
    console.error("Demo user not found! Run the seed script first.");
    return;
  }
  
  // Create a verification token (valid for 24 hours)
  const token = uuidv4();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  await prisma.verificationToken.create({
    data: {
      identifier: demoUser.email,
      token,
      expires,
    },
  });
  
  // Print the sign-in link
  console.log(`\n🔑 Sign-in link for demo@example.com:\n`);
  console.log(`http://localhost:3000/auth/callback/email?token=${token}\n`);
  console.log(`This link will expire in 24 hours.\n`);
}

// Run the function
createSignInToken()
  .catch((e) => {
    console.error("Error creating sign-in token:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
