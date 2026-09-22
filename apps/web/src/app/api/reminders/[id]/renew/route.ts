import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus, formatDate } from "@/lib/utils";
import { sendEmail, getRenewalConfirmationTemplate } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { newExpiryDate, notes } = await req.json();

    if (!newExpiryDate) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "New expiry date is required" } },
        { status: 400 }
      );
    }

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: session.user.id },
      include: { category: true },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Reminder not found" } },
        { status: 404 }
      );
    }

    const newExpiry = new Date(newExpiryDate);

    // Transaction: save history, update reminder, reset schedules
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Save renewal history
      await tx.renewalHistory.create({
        data: {
          reminderId: id,
          previousExpiryDate: reminder.expiryDate,
          newExpiryDate: newExpiry,
          renewedAt: new Date(),
          notes,
        },
      });

      // 2. Update expiry date
      const updatedReminder = await tx.reminder.update({
        where: { id },
        data: {
          expiryDate: newExpiry,
          status: "active",
          updatedAt: new Date(),
        },
      });

      // 3. Reset notification schedules (delete pending logs)
      await tx.notificationLog.updateMany({
        where: {
          reminderId: id,
          status: "pending",
          scheduledFor: { gte: new Date() },
        },
        data: { status: "skipped" },
      });

      return updatedReminder;
    });

    // Send renewal confirmation email
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `Renewal confirmed: ${reminder.title}`,
        html: getRenewalConfirmationTemplate({
          name: user.name,
          reminderTitle: reminder.title,
          previousExpiry: formatDate(reminder.expiryDate),
          newExpiry: formatDate(newExpiry),
        }),
      });
    }

    const daysRemaining = getDaysRemaining(updated.expiryDate, user?.timezone || "Asia/Kathmandu");
    const computedStatus = computeStatus(daysRemaining);

    return NextResponse.json({ success: true, data: { ...updated, daysRemaining, computedStatus } });
  } catch (error) {
    console.error("[renew POST]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to renew reminder" } },
      { status: 500 }
    );
  }
}
