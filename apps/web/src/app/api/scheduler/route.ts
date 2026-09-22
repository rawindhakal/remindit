import { NextRequest, NextResponse } from "next/server";
import { processReminders, processWeeklySummaries } from "@/lib/reminder-engine";

// This route is called by a cron job daily at 00:05
// Protect with a secret token
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type = "reminders" } = await req.json().catch(() => ({ type: "reminders" }));

    if (type === "weekly") {
      await processWeeklySummaries();
    } else {
      await processReminders();
    }

    return NextResponse.json({ success: true, data: { message: "Scheduler completed" } });
  } catch (error) {
    console.error("[scheduler]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Scheduler failed" } },
      { status: 500 }
    );
  }
}
