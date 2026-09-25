import { NextRequest, NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getMobileAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const timezone = user.timezone || "Asia/Kathmandu";

    const reminders = await prisma.reminder.findMany({
      where: {
        userId: user.id,
        status: { not: "deleted" },
      },
      include: {
        category: true,
        reminderSchedules: {
          where: { enabled: true },
          orderBy: { daysBefore: "desc" },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    const enriched = reminders.map((r) => {
      const daysRemaining = getDaysRemaining(r.expiryDate, timezone);
      const computedStatus = computeStatus(daysRemaining);
      return { ...r, daysRemaining, computedStatus };
    });

    const counts = {
      active: enriched.filter((r) => r.computedStatus === "active").length,
      due_soon: enriched.filter((r) => r.computedStatus === "due_soon").length,
      today: enriched.filter((r) => r.computedStatus === "today").length,
      expired: enriched.filter((r) => r.computedStatus === "expired").length,
    };

    const upcoming = enriched
      .filter((r) => r.computedStatus !== "expired" && r.computedStatus !== "active")
      .concat(enriched.filter((r) => r.computedStatus === "active"))
      .slice(0, 15);

    const needsAttention = enriched
      .filter((r) => r.computedStatus === "expired")
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      counts,
      upcoming,
      needsAttention,
      total: reminders.length,
    });
  } catch (error: any) {
    console.error("[mobile dashboard GET]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
