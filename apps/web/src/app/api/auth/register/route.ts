import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/utils";
import { sendEmail, getVerifyEmailTemplate } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, timezone = "Asia/Kathmandu" } = body;

    // Validate
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name, email, and password are required" } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" } },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const isEmailConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        timezone,
        emailVerifiedAt: isEmailConfigured ? null : new Date(),
        notificationPreferences: {
          create: {
            emailEnabled: true,
            expiryDayEnabled: true,
            overdueEnabled: false,
            weeklySummaryEnabled: true,
          },
        },
      },
    });

    // Create email verification token
    const token = generateToken(64);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
        userId: user.id,
      },
    });

    // Send verification email
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: "Verify your RenewIt account",
      html: getVerifyEmailTemplate(name, verifyUrl),
    });

    return NextResponse.json(
      { success: true, data: { message: "Account created. Please check your email to verify your account." } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
