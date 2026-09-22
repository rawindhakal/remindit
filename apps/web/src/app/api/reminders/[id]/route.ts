import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: session.user.id },
      include: {
        category: true,
        reminderSchedules: { orderBy: { daysBefore: "desc" } },
        renewalHistory: { orderBy: { renewedAt: "desc" } },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Reminder not found" } },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const daysRemaining = getDaysRemaining(reminder.expiryDate, user?.timezone || "Asia/Kathmandu");
    const computedStatus = computeStatus(daysRemaining);

    return NextResponse.json({ success: true, data: { ...reminder, daysRemaining, computedStatus } });
  } catch (error) {
    console.error("[reminder GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch reminder" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    // Ensure reminder belongs to user
    const existing = await prisma.reminder.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Reminder not found" } },
        { status: 404 }
      );
    }

    const { schedules, ...data } = body;

    const updated = await prisma.$transaction(async (tx) => {
      // Update reminder fields
      const reminder = await tx.reminder.update({
        where: { id },
        data: {
          ...data,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          updatedAt: new Date(),
        },
      });

      // Update schedules if provided
      if (schedules !== undefined) {
        await tx.reminderSchedule.deleteMany({ where: { reminderId: id } });
        if (schedules.length > 0) {
          await tx.reminderSchedule.createMany({
            data: schedules.map((s: { daysBefore: number; enabled?: boolean }) => ({
              reminderId: id,
              daysBefore: s.daysBefore,
              channel: "email",
              enabled: s.enabled ?? true,
              sendTime: "08:00",
            })),
          });
        }
      }

      return reminder;
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const daysRemaining = getDaysRemaining(updated.expiryDate, user?.timezone || "Asia/Kathmandu");
    const computedStatus = computeStatus(daysRemaining);

    return NextResponse.json({ success: true, data: { ...updated, daysRemaining, computedStatus } });
  } catch (error) {
    console.error("[reminder PATCH]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update reminder" } },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.reminder.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Reminder not found" } },
        { status: 404 }
      );
    }

    await prisma.reminder.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { message: "Reminder deleted" } });
  } catch (error) {
    console.error("[reminder DELETE]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete reminder" } },
      { status: 500 }
    );
  }
}
