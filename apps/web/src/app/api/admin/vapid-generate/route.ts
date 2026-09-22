import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import webpush from "web-push";

export async function POST() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || role !== "super_admin") {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Super admin access required" } },
      { status: 403 }
    );
  }

  try {
    const vapidKeys = webpush.generateVAPIDKeys();
    return NextResponse.json({
      success: true,
      data: {
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
      },
    });
  } catch (error) {
    console.error("[vapid-generate]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to generate VAPID keys" } },
      { status: 500 }
    );
  }
}
