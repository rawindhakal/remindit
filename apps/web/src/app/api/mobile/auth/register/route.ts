import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isEmailConfigured = Boolean(
      process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    );

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "user",
        emailVerifiedAt: !isEmailConfigured ? new Date() : null,
      },
    });

    // Create default notification preferences
    await prisma.notificationPreference
      .create({
        data: {
          userId: user.id,
          emailEnabled: true,
          pushEnabled: true,
          expiryDayEnabled: true,
          overdueEnabled: false,
          weeklySummaryEnabled: true,
          summaryDay: 1,
        },
      })
      .catch(() => {});

    const token = signMobileToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
      },
    });
  } catch (error: any) {
    console.error("Mobile register error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error occurred" },
      { status: 500 }
    );
  }
}
