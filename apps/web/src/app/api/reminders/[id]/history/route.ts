import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Reminder not found" } },
        { status: 404 }
      );
    }

    const history = await prisma.renewalHistory.findMany({
      where: { reminderId: id },
      orderBy: { renewedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error("[history GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch history" } },
      { status: 500 }
    );
  }
}
