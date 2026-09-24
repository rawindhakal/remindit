import { NextResponse } from "next/server";
import { checkInstallationStatus } from "@/lib/installer";

export async function GET() {
  try {
    const status = await checkInstallationStatus();
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "production",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INSTALL_STATUS_ERROR",
          message: error?.message || "Failed to check installation status",
        },
      },
      { status: 500 }
    );
  }
}
