import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Attempt a lightweight query
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      success: true,
      message: "Database connection successful! Tables and permissions verified.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DB_CONNECTION_FAILED",
          message: error?.message || "Could not connect to database. Please check DATABASE_URL.",
        },
      },
      { status: 400 }
    );
  }
}
