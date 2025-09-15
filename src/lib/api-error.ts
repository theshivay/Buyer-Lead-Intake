import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Import Prisma error types
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    // Validation errors
    return NextResponse.json(
      {
        error: "Validation error",
        details: error.format(),
      },
      { status: 400 }
    );
  } else if (error instanceof PrismaClientKnownRequestError) {
    // Known Prisma errors
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      return NextResponse.json(
        {
          error: "Duplicate entry",
          details: `A record with this ${target ? target.join(", ") : "field"} already exists.`,
        },
        { status: 409 }
      );
    } else if (error.code === "P2025") {
      return NextResponse.json(
        {
          error: "Not found",
          details: "The requested resource does not exist.",
        },
        { status: 404 }
      );
    } else if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Foreign key constraint failed",
          details: "Referenced record does not exist.",
        },
        { status: 400 }
      );
    }
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "You are not authorized to perform this action.",
        },
        { status: 401 }
      );
    } else if (error.message.includes("Forbidden")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          details: "You don't have permission to access this resource.",
        },
        { status: 403 }
      );
    } else if (error.message.includes("Not Found")) {
      return NextResponse.json(
        {
          error: "Not found",
          details: "The requested resource does not exist.",
        },
        { status: 404 }
      );
    }
  }

  // Generic server error
  return NextResponse.json(
    {
      error: "Internal server error",
      details: "Something went wrong. Please try again later.",
    },
    { status: 500 }
  );
}
