import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { 
  buyerCsvRowSchema, 
  buyerQuerySchema, 
  City, 
  PropertyType, 
  BHK, 
  Purpose, 
  Timeline, 
  Source, 
  Status 
} from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "papaparse";
import { z } from "zod";

// Handle CSV import
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    
    // Handle demo login case - if no ID is present but user is logged in
    let userId = session?.user?.id;
    
    if (!userId && session?.user?.email === "demo@example.com") {
      // Try to get demo user from database
      const demoUser = await prisma.user.findUnique({
        where: { email: "demo@example.com" },
      });
      
      if (demoUser) {
        userId = demoUser.id;
        console.log("Using demo user ID:", userId);
      } else {
        // Create a demo user if needed
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
      console.log("Unauthorized: Missing session or user ID", { session, userId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Log for debugging
    console.log("User ID from session:", userId);

    // Parse form data with CSV file
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    // Read file contents
    const fileContents = await file.text();
    
    // Parse CSV
    const { data, errors } = parse(fileContents, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: "Invalid CSV format", details: errors }, { status: 400 });
    }

    // Maximum number of rows allowed
    const maxRows = 200;
    if (data.length > maxRows) {
      return NextResponse.json(
        { error: `CSV contains too many rows. Maximum allowed is ${maxRows}` },
        { status: 400 }
      );
    }

    // Validate each row
    const validationResults = (data as Record<string, string>[]).map((row, index: number) => {
      try {
        const validated = buyerCsvRowSchema.parse(row);
        return { row: index + 1, valid: true, data: validated };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            row: index + 1,
            valid: false,
            errors: error.format(),
          };
        }
        return {
          row: index + 1,
          valid: false,
          errors: { _errors: ["Unknown validation error"] },
        };
      }
    });

    // Check if all rows are valid
    const invalidRows = validationResults.filter((result) => !result.valid);
    
    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: "Validation errors in CSV data",
          invalidRows,
        },
        { status: 400 }
      );
    }

    // All rows are valid, insert them into the database
    const validRows = validationResults.map((result) => result.data);
    
    // Insert in transaction
    const insertResult = await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">) => {
      const insertedBuyers = [];
      
      for (const row of validRows as z.infer<typeof buyerCsvRowSchema>[]) {
        // Map BHK value from string to enum
        let bhkValue = null;
        if (row.bhk) {
          const bhkMapping: Record<string, string> = {
            "Studio": "Studio",
            "1": "One",
            "2": "Two",
            "3": "Three",
            "4": "Four",
          };
          bhkValue = bhkMapping[row.bhk] || null;
        }
        
        // Map timeline value
        let timelineValue;
        if (row.timeline === "0-3m") timelineValue = "ZeroToThreeMonths";
        else if (row.timeline === "3-6m") timelineValue = "ThreeToSixMonths";
        else if (row.timeline === ">6m") timelineValue = "MoreThanSixMonths";
        else timelineValue = "Exploring";
        
        // Map source value
        let sourceValue = row.source;
        if (sourceValue === "Walk-in") sourceValue = "WalkIn";
        
        const buyer = await tx.buyer.create({
          data: {
            fullName: row.fullName,
            email: row.email || null,
            phone: row.phone,
            city: row.city as City,
            propertyType: row.propertyType as PropertyType,
            bhk: bhkValue as BHK | null,
            purpose: row.purpose as Purpose,
            budgetMin: row.budgetMin || null,
            budgetMax: row.budgetMax || null,
            timeline: timelineValue as Timeline,
            source: sourceValue as Source,
            status: (row.status || "New") as Status,
            notes: row.notes || null,
            tags: row.tags || "",
            owner: {
              connect: {
                id: userId,
              },
            },
          },
        });
        
        // Create history record
        await tx.buyerHistory.create({
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
              source: "csv_import",
              fields: { ...row },
            }),
          },
        });
        
        insertedBuyers.push(buyer);
      }
      
      return insertedBuyers;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertResult.length} buyers`,
      count: insertResult.length,
    });
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json({ error: "Failed to import CSV" }, { status: 500 });
  }
}

// Handle CSV export (using query parameters from GET request)
export async function GET(request: NextRequest) {
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
      }
    }
    
    if (!session || !session.user || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const validatedParams = buyerQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      city: searchParams.get("city") || undefined,
      propertyType: searchParams.get("propertyType") || undefined,
      status: searchParams.get("status") || undefined,
      timeline: searchParams.get("timeline") || undefined,
      sortBy: searchParams.get("sortBy") || "updatedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    });

    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    // Add search filter
    if (validatedParams.search) {
      where.OR = [
        { fullName: { contains: validatedParams.search } },
        { email: { contains: validatedParams.search } },
        { phone: { contains: validatedParams.search } },
      ];
    }
    
    // Add other filters
    if (validatedParams.city) where.city = validatedParams.city;
    if (validatedParams.propertyType) where.propertyType = validatedParams.propertyType;
    if (validatedParams.status) where.status = validatedParams.status;
    if (validatedParams.timeline) where.timeline = validatedParams.timeline;

    // Fetch buyers with applied filters
    const buyers = await prisma.buyer.findMany({
      where,
      orderBy: { [validatedParams.sortBy]: validatedParams.sortOrder },
      select: {
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
        notes: true,
        tags: true,
        status: true,
      },
    });
    
    // Define the type for database query result
    interface BuyerQueryResult {
      fullName: string;
      email: string | null;
      phone: string;
      city: City;
      propertyType: PropertyType;
      bhk: BHK | null;
      purpose: Purpose;
      budgetMin: number | null;
      budgetMax: number | null;
      timeline: Timeline;
      source: Source;
      notes: string | null;
      tags: string | null;
      status: Status;
    }
    
    // Define the type for CSV export data
    type BuyerCsvExport = {
      fullName: string;
      email: string;
      phone: string;
      city: City;
      propertyType: PropertyType;
      bhk: string;
      purpose: Purpose;
      budgetMin: string;
      budgetMax: string;
      timeline: Timeline;
      source: Source;
      notes: string;
      tags: string;
      status: Status;
    };

    // Transform data for CSV export
    const csvData = buyers.map((buyer: BuyerQueryResult): BuyerCsvExport => ({
      fullName: buyer.fullName,
      email: buyer.email || "",
      phone: buyer.phone,
      city: buyer.city,
      propertyType: buyer.propertyType,
      bhk: buyer.bhk || "",
      purpose: buyer.purpose,
      budgetMin: buyer.budgetMin?.toString() || "",
      budgetMax: buyer.budgetMax?.toString() || "",
      timeline: buyer.timeline,
      source: buyer.source,
      notes: buyer.notes || "",
      tags: buyer.tags || "",
      status: buyer.status,
    }));
    
    // Generate CSV content
    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map((row: BuyerCsvExport) => 
        Object.values(row)
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    
    // Return CSV as response
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="buyers-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}
