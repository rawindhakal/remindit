import { NextResponse } from "next/server";
import { checkInstallationStatus, executeInstallation } from "@/lib/installer";

export async function POST(req: Request) {
  try {
    // 1. Security Check: prevent reinstalling if already installed
    const currentStatus = await checkInstallationStatus();
    if (currentStatus.installed && currentStatus.hasSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_INSTALLED",
            message: "RenewIt is already installed. For security, the installer is locked.",
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      adminName,
      adminEmail,
      adminPassword,
      timezone,
      appName,
      smtpEmail,
      smtpPass,
    } = body;

    // 2. Validate input
    if (!adminName || !adminName.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Admin Name is required." } },
        { status: 400 }
      );
    }

    if (!adminEmail || !adminEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "A valid Admin Email is required." } },
        { status: 400 }
      );
    }

    if (!adminPassword || adminPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters long." },
        },
        { status: 400 }
      );
    }

    // 3. Execute installation
    const result = await executeInstallation({
      adminName,
      adminEmail,
      adminPassword,
      timezone: timezone || "Asia/Kathmandu",
      appName: appName || "RenewIt",
      smtpEmail,
      smtpPass,
    });

    return NextResponse.json({
      success: true,
      message: "Installation completed successfully! You can now log into your Super Admin account.",
      data: result,
    });
  } catch (error: any) {
    console.error("[install/setup error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INSTALL_FAILED",
          message: error?.message || "Installation failed. Please verify database connection and permissions.",
        },
      },
      { status: 500 }
    );
  }
}
