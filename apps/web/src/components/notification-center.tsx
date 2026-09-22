"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePushNotifications } from "./pwa-register";
import { formatDaysRemaining, getStatusConfig } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  daysRemaining: number;
  computedStatus: string;
  category: { icon: string | null; name: string } | null;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isSubscribed, subscribeToPush, sendTestPush, isLoading } = usePushNotifications();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const upcoming = json.data.upcoming || [];
          const expired = json.data.expired || [];
          const urgent = [...expired, ...upcoming.filter((u: any) => u.daysRemaining <= 7)];
          setItems(urgent);
          setUnreadCount(urgent.length);
        }
      })
      .catch(console.error);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTestNotification = async () => {
    setIsTesting(true);
    await sendTestPush();
    setIsTesting(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 004.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <span>🔔</span> Notifications & Alerts
            </h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {unreadCount} urgent
              </span>
            )}
          </div>

          {/* Web Push Toggle / Status Box */}
          <div className="my-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-900">Device Push Alerts</p>
                <p className="text-[11px] text-blue-700">Receive alerts even when app is closed</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSubscribed ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                }`}
              >
                {isSubscribed ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              {!isSubscribed ? (
                <button
                  onClick={subscribeToPush}
                  disabled={isLoading}
                  className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Enabling..." : "Enable Push Alerts"}
                </button>
              ) : (
                <button
                  onClick={handleTestNotification}
                  disabled={isTesting}
                  className="flex-1 py-1.5 px-3 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isTesting ? "Sending..." : "Send Test Alert"}
                </button>
              )}
            </div>
          </div>

          {/* Urgent Items List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <span className="text-2xl">✨</span>
                <p className="text-xs mt-1">No urgent alerts at the moment.</p>
              </div>
            ) : (
              items.map((item) => {
                const statusCfg = getStatusConfig(item.computedStatus);
                return (
                  <Link
                    key={item.id}
                    href={`/reminders/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start justify-between p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-xs group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xl shrink-0 mt-0.5">{item.category?.icon || "📄"}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {item.title}
                        </p>
                        <p
                          className={`text-[11px] font-medium mt-0.5 ${
                            item.daysRemaining < 0
                              ? "text-red-600"
                              : item.daysRemaining <= 7
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {formatDaysRemaining(item.daysRemaining)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${statusCfg.className} shrink-0`}>
                      {statusCfg.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 text-center">
            <Link
              href="/reminders"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all reminders →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
