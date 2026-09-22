import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysRemaining, computeStatus, formatDate } from "@/lib/utils";

export async function GET() {
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

    const rows = [
      ["Title", "Category", "Owner", "Reference Number", "Provider", "Expiry Date", "Days Remaining", "Status"].join(","),
    ];

    for (const r of reminders) {
      const days = getDaysRemaining(r.expiryDate, timezone);
      const status = computeStatus(days);
      const escape = (str: string | null | undefined) => `"${(str || "").replace(/"/g, '""')}"`;

      rows.push(
        [
          escape(r.title),
          escape(r.category?.name || "Uncategorized"),
          escape(r.ownerName),
          escape(r.referenceNumber),
          escape(r.providerName),
          formatDate(r.expiryDate),
          days.toString(),
          status,
        ].join(",")
      );
    }

    const csvContent = rows.join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="renewit-reminders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[export GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to export CSV" } },
      { status: 500 }
    );
  }
}
