"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatDaysRemaining, getStatusConfig, ReminderStatus } from "@/lib/utils";

interface Reminder {
  id: string;
  title: string;
  expiryDate: string;
  daysRemaining: number;
  computedStatus: ReminderStatus;
  category: { icon: string | null; name: string } | null;
}

export default function CalendarPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Month navigation: current active date view
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reminders?pageSize=100")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setReminders(json.data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Calendar math
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0, Sunday=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map reminders to YYYY-MM-DD
  const remindersByDate = reminders.reduce<Record<string, Reminder[]>>((acc, r) => {
    const dateKey = r.expiryDate.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(r);
    return acc;
  }, {});

  const selectedReminders = selectedDateStr ? remindersByDate[selectedDateStr] || [] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">View upcoming expiries by month and date</p>
        </div>
        <Link
          href="/reminders/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
        >
          + Add Reminder
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-lg font-bold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                aria-label="Previous Month"
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setViewDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                aria-label="Next Month"
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                →
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 uppercase py-2 border-b border-gray-100">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty offset slots */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[64px] bg-gray-50/50 rounded-xl" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayReminders = remindersByDate[dateStr] || [];
              const isSelected = selectedDateStr === dateStr;

              const todayStr = new Date().toISOString().split("T")[0];
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-[70px] p-2 rounded-xl text-left flex flex-col justify-between border transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50"
                      : isToday
                      ? "border-blue-300 bg-blue-50/20"
                      : "border-gray-100 hover:bg-gray-50 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? "w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center" : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>
                    {dayReminders.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {dayReminders.length}
                      </span>
                    )}
                  </div>

                  {dayReminders.length > 0 && (
                    <div className="flex gap-1 mt-1 overflow-hidden">
                      {dayReminders.slice(0, 3).map((r, idx) => (
                        <span key={idx} className="text-xs shrink-0" title={r.title}>
                          {r.category?.icon || "•"}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            {selectedDateStr ? formatDate(selectedDateStr) : "Select a date"}
          </h2>

          {!selectedDateStr ? (
            <p className="text-sm text-gray-400 italic">Click on any date in the calendar to see expiries due on that day.</p>
          ) : selectedReminders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <span className="text-3xl">☕</span>
              <p className="text-sm mt-2">No renewals due on this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedReminders.map((r) => {
                const statusCfg = getStatusConfig(r.computedStatus);
                return (
                  <Link
                    key={r.id}
                    href={`/reminders/${r.id}`}
                    className="block p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors bg-gray-50/50 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">{r.category?.icon || "📄"}</span>
                        <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 truncate">
                          {r.title}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusCfg.className} shrink-0`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 font-medium">
                      {formatDaysRemaining(r.daysRemaining)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
