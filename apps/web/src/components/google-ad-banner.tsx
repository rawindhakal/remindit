"use client";

import { useEffect, useState } from "react";

interface GoogleAdBannerProps {
  slot?: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  className?: string;
}

export function GoogleAdBanner({ slot, format = "auto", className = "" }: GoogleAdBannerProps) {
  const [adConfig, setAdConfig] = useState<{ enabled: boolean; clientId: string; slot?: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.googleAds) {
          const { enabled, clientId, topBannerSlot, bottomSlot } = json.data.googleAds;
          const targetSlot = slot || topBannerSlot || bottomSlot;
          setAdConfig({ enabled, clientId, slot: targetSlot });

          if (enabled && typeof window !== "undefined") {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            } catch (e) {
              console.warn("AdSense push error:", e);
            }
          }
        }
      })
      .catch(() => {});
  }, [slot]);

  if (!adConfig?.enabled || !adConfig.clientId) {
    return null;
  }

  return (
    <div className={`my-4 overflow-hidden rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center p-2 ${className}`}>
      <span className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider">Sponsored Advertisement</span>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={adConfig.clientId}
        data-ad-slot={slot || ""}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
