import { NextRequest, NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus } from "@/lib/utils";

export async function GET(
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
    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId: user.id,
        status: { not: "deleted" },
      },
      include: {
        category: true,
        reminderSchedules: {
          orderBy: { daysBefore: "desc" },
        },
        renewalHistory: {
          orderBy: { renewedAt: "desc" },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, message: "Reminder not found" },
        { status: 404 }
      );
    }

    const timezone = user.timezone || "Asia/Kathmandu";
    const daysRemaining = getDaysRemaining(reminder.expiryDate, timezone);
    const computedStatus = computeStatus(daysRemaining);

    return NextResponse.json({
      success: true,
      data: {
        ...reminder,
        daysRemaining,
        computedStatus,
      },
    });
  } catch (error: any) {
    console.error("[mobile reminder GET]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch reminder" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const existing = await prisma.reminder.findFirst({
      where: { id, userId: user.id, status: { not: "deleted" } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Reminder not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description ? body.description.trim() : null;
    if (body.ownerName !== undefined)
      updateData.ownerName = body.ownerName ? body.ownerName.trim() : null;
    if (body.referenceNumber !== undefined)
      updateData.referenceNumber = body.referenceNumber
        ? body.referenceNumber.trim()
        : null;
    if (body.providerName !== undefined)
      updateData.providerName = body.providerName
        ? body.providerName.trim()
        : null;
    if (body.expiryDate !== undefined)
      updateData.expiryDate = new Date(body.expiryDate);
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.isRecurring !== undefined)
      updateData.isRecurring = Boolean(body.isRecurring);

    // Merge documents in metadata
    if (body.documents !== undefined) {
      const currentMeta = (existing.metadata as any) || {};
      updateData.metadata = {
        ...currentMeta,
        documents: body.documents,
      };
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: updateData,
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
    console.error("[mobile reminder PATCH]", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update reminder" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existing = await prisma.reminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Reminder not found" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.reminder.update({
      where: { id },
      data: { status: "deleted" },
    });

    return NextResponse.json({
      success: true,
      message: "Reminder deleted successfully",
    });
  } catch (error: any) {
    console.error("[mobile reminder DELETE]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
