import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }

  try {
    const [
      totalUsers,
      totalReminders,
      activeReminders,
      pushSubscriptionsCount,
      notificationLogsCount,
      failedLogsCount,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.reminder.count({ where: { status: { not: "deleted" } } }),
      prisma.reminder.count({ where: { status: "active" } }),
      prisma.pushSubscription.count(),
      prisma.notificationLog.count(),
      prisma.notificationLog.count({ where: { status: "failed" } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalReminders,
        activeReminders,
        pushSubscriptionsCount,
        notificationLogsCount,
        failedLogsCount,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("[admin metrics]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch admin metrics" } },
      { status: 500 }
    );
  }
}
