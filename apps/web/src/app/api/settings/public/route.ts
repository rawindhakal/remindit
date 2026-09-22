import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export async function GET() {
  try {
    const [
      adsEnabled,
      adsClientId,
      adsTopSlot,
      adsSidebarSlot,
      adsBottomSlot,
      adsAutoAds,
      googleAuthEnabled,
      pushEnabled,
      vapidPublicKey,
    ] = await Promise.all([
      getSetting("google_ads.enabled", "false"),
      getSetting("google_ads.client_id", ""),
      getSetting("google_ads.top_banner_slot", ""),
      getSetting("google_ads.sidebar_slot", ""),
      getSetting("google_ads.bottom_slot", ""),
      getSetting("google_ads.auto_ads", "false"),
      getSetting("google_auth.enabled", "false"),
      getSetting("push.enabled", "true"),
      getSetting("push.vapid_public_key", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        googleAds: {
          enabled: adsEnabled === "true",
          clientId: adsClientId,
          topBannerSlot: adsTopSlot,
          sidebarSlot: adsSidebarSlot,
          bottomSlot: adsBottomSlot,
          autoAds: adsAutoAds === "true",
        },
        googleAuth: {
          enabled: googleAuthEnabled === "true",
        },
        push: {
          enabled: pushEnabled === "true",
          vapidPublicKey,
        },
      },
    });
  } catch (error) {
    console.error("[public settings GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch public settings" } },
      { status: 500 }
    );
  }
}
