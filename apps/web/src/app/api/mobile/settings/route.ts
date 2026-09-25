import { NextRequest, NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = await getMobileAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          emailEnabled: true,
          pushEnabled: true,
          expiryDayEnabled: true,
          overdueEnabled: false,
          weeklySummaryEnabled: true,
          summaryDay: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        preferences,
      },
    });
  } catch (error: any) {
    console.error("[mobile settings GET]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getMobileAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { name, timezone, currentPassword, newPassword, preferences } = body;

    // Password change request
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: "Current password is required" },
          { status: 400 }
        );
      }
      const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!fullUser || !fullUser.passwordHash) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }
      const isValid = await bcrypt.compare(currentPassword, fullUser.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Incorrect current password" },
          { status: 400 }
        );
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    // Name or timezone update
    if (name || timezone) {
      const userUpdate: any = {};
      if (name) userUpdate.name = name.trim();
      if (timezone) userUpdate.timezone = timezone.trim();
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdate,
      });
    }

    // Preferences update
    if (preferences) {
      await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        update: preferences,
        create: {
          userId: user.id,
          ...preferences,
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true, timezone: true },
    });
    const updatedPreferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        preferences: updatedPreferences,
      },
    });
  } catch (error: any) {
    console.error("[mobile settings PATCH]", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
