import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/utils";
import { sendEmail, getPasswordResetTemplate } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email is required" } },
        { status: 400 }
      );
    }

    // Always return success to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Delete existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email } });

      // Create new token
      const token = generateToken(64);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { email, token, expires },
      });

      // Send reset email
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      await sendEmail({
        to: email,
        subject: "Reset your RenewIt password",
        html: getPasswordResetTemplate(user.name, resetUrl),
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: "If an account exists with that email, a reset link has been sent." },
    });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
