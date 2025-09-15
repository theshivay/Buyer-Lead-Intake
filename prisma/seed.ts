import { PrismaClient } from "@prisma/client";

// Create a new Prisma client instance
const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log(`Created user: ${demoUser.name} (${demoUser.email})`);

  // Create some sample buyers
  const buyers = [
    {
      fullName: "John Doe",
      email: "john.doe@example.com",
      phone: "9876543210",
      city: "Chandigarh", // This will be automatically converted to the enum value
      propertyType: "Apartment",
      bhk: "Two",
      purpose: "Buy",
      budgetMin: 5000000,
      budgetMax: 8000000,
      timeline: "ThreeToSixMonths",
      source: "Website",
      notes: "Looking for a spacious apartment in a gated community",
      tags: "serious buyer,ready to move",
      status: "New",
      ownerId: demoUser.id,
    },
    {
      fullName: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "8765432109",
      city: "Mohali",
      propertyType: "Villa",
      bhk: "Three",
      purpose: "Buy",
      budgetMin: 10000000,
      budgetMax: 15000000,
      timeline: "ZeroToThreeMonths",
      source: "Referral",
      notes: "Interested in premium villas with garden",
      tags: "premium,garden",
      status: "Contacted",
      ownerId: demoUser.id,
    },
    {
      fullName: "Ravi Kumar",
      email: "ravi@example.com",
      phone: "7654321098",
      city: "Zirakpur",
      propertyType: "Plot",
      bhk: null,
      purpose: "Buy",
      budgetMin: 2000000,
      budgetMax: 5000000,
      timeline: "MoreThanSixMonths",
      source: "WalkIn",
      notes: "Looking for investment opportunity",
      tags: "investor",
      status: "Qualified",
      ownerId: demoUser.id,
    },
  ];

  try {
    // Create one buyer at a time to avoid type issues
    for (const buyerData of buyers) {
      const buyer = await prisma.buyer.create({
        data: {
          fullName: buyerData.fullName,
          email: buyerData.email,
          phone: buyerData.phone,
          city: buyerData.city as any, // Type cast for enum values
          propertyType: buyerData.propertyType as any,
          bhk: buyerData.bhk as any,
          purpose: buyerData.purpose as any,
          budgetMin: buyerData.budgetMin,
          budgetMax: buyerData.budgetMax,
          timeline: buyerData.timeline as any,
          source: buyerData.source as any,
          notes: buyerData.notes,
          tags: buyerData.tags,
          status: buyerData.status as any,
          ownerId: buyerData.ownerId,
        },
      });
      
      console.log(`Created buyer: ${buyer.fullName}`);
    }
  } catch (error) {
    console.error("Error creating buyers:", error);
  }

  console.log("✅ Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
