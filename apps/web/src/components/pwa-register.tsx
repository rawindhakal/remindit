"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✓ RenewIt Service Worker active with scope:", registration.scope);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }

    // 2. Check if already running standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // 3. Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !isInstallable) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-sm bg-blue-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-bounce-subtle">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-2xl shrink-0">📲</span>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight truncate">Install RenewIt App</p>
          <p className="text-[11px] text-blue-100 mt-0.5">Quick access & instant notifications</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-xs"
        >
          Install
        </button>
        <button
          onClick={() => setIsInstallable(false)}
          className="p-1 text-blue-200 hover:text-white rounded-md"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to request browser push notifications and subscribe with VAPID
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(Boolean(sub));
    } catch (e) {
      console.error(e);
    }
  };

  const subscribeToPush = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Push notifications are not supported by your browser.");
      return false;
    }

    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        alert("Push notification permission was denied.");
        setIsLoading(false);
        return false;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("VAPID public key not configured.");
      }

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      const subData = subscription.toJSON();
      const res = await fetch("/api/notifications/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subData.endpoint,
          keys: subData.keys,
        }),
      });

      if (!res.ok) throw new Error("Failed to save push subscription on server");

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      alert(err.message || "Failed to subscribe to push notifications");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestPush = async () => {
    try {
      const res = await fetch("/api/notifications/push-subscribe");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);
      return true;
    } catch (err: any) {
      alert(err.message || "Error sending test notification");
      return false;
    }
  };

  return {
    permission,
    isSubscribed,
    isLoading,
    subscribeToPush,
    sendTestPush,
  };
}
