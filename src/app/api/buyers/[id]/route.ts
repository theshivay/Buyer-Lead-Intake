import { prisma } from "@/lib/prisma";
import { buyerFormSchema } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/buyers/[id]'>
) {
  const params = await context.params;
  try {
    const { id } = params;

    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch buyer record with history
    const buyer = await prisma.buyer.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { changedAt: "desc" },
          take: 5,
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    return NextResponse.json(buyer);
  } catch (error) {
    console.error("Error fetching buyer:", error);
    return NextResponse.json({ error: "Failed to fetch buyer" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<'/api/buyers/[id]'>
) {
  const params = await context.params;
  try {
    const { id } = params;

    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const userId = session.user.id;
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `${userId}:${ipAddress}`;

    const rateLimit = {
      tokenBucket: new Map<string, { tokens: number; lastRefill: number }>(),
      maxTokens: 10,
      refillRate: 1,
      
      check(key: string): boolean {
        const now = Date.now();
        let bucket = this.tokenBucket.get(key);
        
        if (!bucket) {
          bucket = { tokens: this.maxTokens, lastRefill: now };
          this.tokenBucket.set(key, bucket);
          return true;
        }
        
        const timePassed = (now - bucket.lastRefill) / 1000;
        const tokensToAdd = Math.floor(timePassed * this.refillRate);
        
        if (tokensToAdd > 0) {
          bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this.maxTokens);
          bucket.lastRefill = now;
        }
        
        if (bucket.tokens > 0) {
          bucket.tokens -= 1;
          return true;
        }
        
        return false;
      }
    };

    if (!rateLimit.check(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Fetch current buyer record to check ownership
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id },
      select: { ownerId: true, updatedAt: true },
    });

    if (!existingBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Check ownership or admin role
    const isOwner = existingBuyer.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to edit this buyer record" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = buyerFormSchema.parse(body);

    // Check for concurrency issues using updatedAt timestamp
    if (validatedData.updatedAt) {
      const lastUpdate = new Date(validatedData.updatedAt);
      
      if (existingBuyer.updatedAt.getTime() !== lastUpdate.getTime()) {
        return NextResponse.json(
          { error: "This record has been modified. Please refresh and try again." },
          { status: 409 }
        );
      }
    }

    // Create a diff of changes
    const oldData = await prisma.buyer.findUnique({
      where: { id },
    });

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    
    if (oldData) {
      // Compare fields and identify changes
      Object.keys(validatedData).forEach((key) => {
        const typedKey = key as keyof typeof oldData;
        if (typedKey in oldData && oldData[typedKey] !== validatedData[typedKey as keyof typeof validatedData]) {
          changes[key] = {
            old: oldData[typedKey],
            new: validatedData[typedKey as keyof typeof validatedData],
          };
        }
      });
    }

    // Update buyer record
    const updatedBuyer = await prisma.buyer.update({
      where: { id },
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
        status: validatedData.status || oldData?.status || "New",
        notes: validatedData.notes || null,
        tags: validatedData.tags || "",
      },
    });

    // Create history record if there are changes
    if (Object.keys(changes).length > 0) {
      await prisma.buyerHistory.create({
        data: {
          buyerId: id,
          changedById: session.user.id,
          diff: JSON.stringify({
            action: "updated",
            changes,
          }),
        },
      });
    }

    return NextResponse.json(updatedBuyer);
  } catch (error) {
    console.error("Error updating buyer:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to update buyer" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<'/api/buyers/[id]'>
) {
  const params = await context.params;
  try {
    const { id } = params;

    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch current buyer record to check ownership
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existingBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Check ownership or admin role
    const isOwner = existingBuyer.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this buyer record" },
        { status: 403 }
      );
    }

    // Delete buyer record (history will be cascaded due to schema setup)
    await prisma.buyer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting buyer:", error);
    return NextResponse.json({ error: "Failed to delete buyer" }, { status: 500 });
  }
}
