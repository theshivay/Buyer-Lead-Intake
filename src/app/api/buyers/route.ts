import { prisma } from "@/lib/prisma";
import { buyerFormSchema, buyerQuerySchema } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Rate limiting for creating/updating buyers
const rateLimit = {
  tokenBucket: new Map<string, { tokens: number; lastRefill: number }>(),
  maxTokens: 10, // Maximum tokens per user
  refillRate: 1, // Tokens per second
  
  check(userId: string): boolean {
    const now = Date.now();
    let userBucket = this.tokenBucket.get(userId);
    
    // Create bucket for new users
    if (!userBucket) {
      userBucket = { tokens: this.maxTokens, lastRefill: now };
      this.tokenBucket.set(userId, userBucket);
      return true;
    }
    
    // Refill tokens based on time elapsed
    const timePassed = (now - userBucket.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      userBucket.tokens = Math.min(userBucket.tokens + tokensToAdd, this.maxTokens);
      userBucket.lastRefill = now;
    }
    
    // Check if user has tokens left
    if (userBucket.tokens > 0) {
      userBucket.tokens -= 1;
      return true;
    }
    
    return false;
  }
};

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const validatedParams = buyerQuerySchema.parse({
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
      search: searchParams.get("search") || undefined,
      city: searchParams.get("city") || undefined,
      propertyType: searchParams.get("propertyType") || undefined,
      status: searchParams.get("status") || undefined,
      timeline: searchParams.get("timeline") || undefined,
      sortBy: searchParams.get("sortBy") || "updatedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    });

    // Deconstruct for easier use
    const { page, limit, search, city, propertyType, status, timeline, sortBy, sortOrder } = validatedParams;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    // Add search filter
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Add other filters
    if (city) where.city = city;
    if (propertyType) where.propertyType = propertyType;
    if (status) where.status = status;
    if (timeline) where.timeline = timeline;

    // Execute query with filters, sorting, and pagination
    const [buyers, totalCount] = await Promise.all([
      prisma.buyer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          city: true,
          propertyType: true,
          bhk: true,
          purpose: true,
          budgetMin: true,
          budgetMax: true,
          timeline: true,
          source: true,
          status: true,
          updatedAt: true,
          ownerId: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.buyer.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      buyers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching buyers:", error);
    return NextResponse.json({ error: "Failed to fetch buyers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    
    // Handle demo login case
    let userId = session?.user?.id;
    
    if (!userId && session?.user?.email === "demo@example.com") {
      // Try to get demo user from database
      const demoUser = await prisma.user.findUnique({
        where: { email: "demo@example.com" },
      });
      
      if (demoUser) {
        userId = demoUser.id;
        console.log("Found demo user:", demoUser);
      } else {
        try {
          const newDemoUser = await prisma.user.create({
            data: {
              id: "demo-user-id-123456",
              name: "Demo User",
              email: "demo@example.com",
              emailVerified: new Date(),
            },
          });
          userId = newDemoUser.id;
          console.log("Created new demo user:", newDemoUser);
        } catch (error) {
          console.error("Failed to create demo user:", error);
        }
      }
    }
    
    if (!session || !session.user || !userId) {
      console.log("Unauthorized: No valid user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Using user ID:", userId);

    // Apply rate limiting
    if (!rateLimit.check(userId)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = buyerFormSchema.parse(body);

    // Create buyer record
    const buyer = await prisma.buyer.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email || null,
        phone: validatedData.phone,
        city: validatedData.city,
        propertyType: validatedData.propertyType,
        bhk: validatedData.bhk || null,
        purpose: validatedData.purpose,
        budgetMin: validatedData.budgetMin || null,
        budgetMax: validatedData.budgetMax || null,
        timeline: validatedData.timeline,
        source: validatedData.source,
        status: validatedData.status || "New",
        notes: validatedData.notes || null,
        tags: validatedData.tags || "",
        owner: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    // Create history record
    await prisma.buyerHistory.create({
      data: {
        buyer: {
          connect: {
            id: buyer.id,
          }
        },
        changedBy: {
          connect: {
            id: userId,
          }
        },
        diff: JSON.stringify({
          action: "created",
          fields: { ...validatedData },
        }),
      },
    });

    return NextResponse.json(buyer, { status: 201 });
  } catch (error) {
    console.error("Error creating buyer:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to create buyer" }, { status: 500 });
  }
}
