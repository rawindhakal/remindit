import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import webpush from "web-push";

async function configureWebPush() {
  const vapidPublicKey = (await getSetting("push.vapid_public_key")) || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = (await getSetting("push.vapid_private_key")) || process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = (await getSetting("push.subject")) || process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }

  const configured = await configureWebPush();
  if (!configured) {
    return NextResponse.json({ success: false, error: { code: "NOT_CONFIGURED", message: "VAPID keys not configured." } }, { status: 400 });
  }

  try {
    const { title, body, url } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Title and body are required" } }, { status: 400 });
    }

    const subscriptions = await prisma.pushSubscription.findMany();

    let sent = 0;
    let failed = 0;

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/dashboard",
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Broadcast complete. Sent to ${sent} devices, ${failed} failed.`,
        sent,
        failed,
      },
    });
  } catch (error) {
    console.error("[push-broadcast]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to broadcast push notification" } },
      { status: 500 }
    );
  }
}
