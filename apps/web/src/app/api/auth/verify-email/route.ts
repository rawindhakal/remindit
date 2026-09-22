import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getWelcomeEmailTemplate } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Token and email are required" } },
        { status: 400 }
      );
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token,
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired verification token" } },
        { status: 400 }
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: verificationToken.userId! },
      data: { emailVerifiedAt: new Date() },
    });

    // Delete the token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    });

    // Send welcome email
    if (verificationToken.user) {
      await sendEmail({
        to: email,
        subject: "Welcome to RenewIt!",
        html: getWelcomeEmailTemplate(verificationToken.user.name),
      });
    }

    return NextResponse.json({ success: true, data: { message: "Email verified successfully" } });
  } catch (error) {
    console.error("[verify-email]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
