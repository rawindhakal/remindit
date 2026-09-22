import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch preferences" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  try {
    const body = await req.json();

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: body,
      create: { userId: session.user.id, ...body },
    });

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update preferences" } },
      { status: 500 }
    );
  }
}
