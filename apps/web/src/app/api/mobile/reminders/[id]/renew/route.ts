import { NextRequest, NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMobileAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { newExpiryDate, notes } = body;

    if (!newExpiryDate) {
      return NextResponse.json(
        { success: false, message: "New expiry date is required" },
        { status: 400 }
      );
    }

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: user.id, status: { not: "deleted" } },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, message: "Reminder not found" },
        { status: 404 }
      );
    }

    // 1. Log renewal history
    await prisma.renewalHistory.create({
      data: {
        reminderId: reminder.id,
        previousExpiryDate: reminder.expiryDate,
        newExpiryDate: new Date(newExpiryDate),
        notes: notes ? notes.trim() : null,
      },
    });

    // 2. Update reminder expiry date and reset status to active
    const updated = await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        expiryDate: new Date(newExpiryDate),
        status: "active",
      },
      include: {
        category: true,
        reminderSchedules: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("[mobile reminder renew POST]", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to renew reminder" },
      { status: 500 }
    );
  }
}
