import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }

  try {
    const settings = await getAllSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("[admin settings GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch settings" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || role !== "super_admin") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Super admin access required" } }, { status: 403 });
  }

  try {
    const { settings } = await req.json();

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Settings object required" } }, { status: 400 });
    }

    const updates = Object.entries(settings).map(([key, val]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(val) },
        create: {
          key,
          value: String(val),
          group: key.split(".")[0] || "general",
        },
      })
    );

    await prisma.$transaction(updates);

    const updatedMap = await getAllSettings();
    return NextResponse.json({ success: true, data: updatedMap });
  } catch (error) {
    console.error("[admin settings PATCH]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update settings" } },
      { status: 500 }
    );
  }
}
