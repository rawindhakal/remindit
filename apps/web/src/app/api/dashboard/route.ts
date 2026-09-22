import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const timezone = user?.timezone || "Asia/Kathmandu";

    const reminders = await prisma.reminder.findMany({
      where: { userId: session.user.id },
      include: { category: true },
      orderBy: { expiryDate: "asc" },
    });

    // Compute status for each
    const enriched = reminders.map((r) => {
      const daysRemaining = getDaysRemaining(r.expiryDate, timezone);
      const computedStatus = computeStatus(daysRemaining);
      return { ...r, daysRemaining, computedStatus };
    });

    // Summary counts
    const counts = {
      active: enriched.filter((r) => r.computedStatus === "active").length,
      due_soon: enriched.filter((r) => r.computedStatus === "due_soon").length,
      today: enriched.filter((r) => r.computedStatus === "today").length,
      expired: enriched.filter((r) => r.computedStatus === "expired").length,
    };

    // Upcoming (due_soon + today), sorted by urgency
    const upcoming = enriched
      .filter((r) => r.computedStatus !== "expired" && r.computedStatus !== "active")
      .concat(enriched.filter((r) => r.computedStatus === "active"))
      .slice(0, 10);

    // Expired items needing renewal
    const expired = enriched.filter((r) => r.computedStatus === "expired").slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        counts,
        upcoming,
        expired,
        total: reminders.length,
      },
    });
  } catch (error) {
    console.error("[dashboard GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch dashboard" } },
      { status: 500 }
    );
  }
}
