import { prisma } from "@/lib/prisma";
import { getDaysRemaining } from "@/lib/utils";
import { emailQueue } from "./email-queue";
import { sendPushToUser } from "./push";

/**
 * Reminder Engine — runs daily at 00:05.
 *
 * For each active reminder:
 * 1. Calculate days remaining (user's timezone)
 * 2. Find matching reminder schedules
 * 3. Check if notification already sent (duplicate prevention)
 * 4. Queue email job
 */
export async function processReminders(): Promise<void> {
  console.log("[reminder-engine] Starting daily reminder scan...");

  const startTime = Date.now();

  try {
    // Fetch all active reminders with their schedules and user preferences
    const reminders = await prisma.reminder.findMany({
      where: {
        status: { not: "deleted" },
        expiryDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // include recently expired (up to 30 days)
        },
      },
      include: {
        user: {
          include: {
            notificationPreferences: true,
          },
        },
        reminderSchedules: { where: { enabled: true, channel: "email" } },
      },
    });

    let processed = 0;
    let queued = 0;
    let skipped = 0;

    for (const reminder of reminders) {
      const prefs = reminder.user.notificationPreferences;

      // Skip if user has disabled email notifications
      if (prefs && !prefs.emailEnabled) {
        skipped++;
        continue;
      }

      const timezone = reminder.user.timezone || "Asia/Kathmandu";
      const daysRemaining = getDaysRemaining(reminder.expiryDate, timezone);

      // Get today's local date string as the scheduledFor key
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: timezone });

      for (const schedule of reminder.reminderSchedules) {
        if (schedule.daysBefore !== daysRemaining) continue;

        // Skip expiry-day email if user disabled it
        if (daysRemaining === 0 && prefs && !prefs.expiryDayEnabled) continue;

        // Duplicate prevention: check if already sent
        const scheduledFor = new Date(todayStr + "T" + schedule.sendTime + ":00");
        const notificationType = `days_before_${schedule.daysBefore}`;

        const alreadyExists = await prisma.notificationLog.findFirst({
          where: {
            reminderId: reminder.id,
            notificationType,
            scheduledFor,
            status: { in: ["sent", "pending"] },
          },
        });

        if (alreadyExists) {
          skipped++;
          continue;
        }

        // Create notification log entry (pending)
        const notificationLog = await prisma.notificationLog.create({
          data: {
            userId: reminder.userId,
            reminderId: reminder.id,
            notificationType,
            channel: "email",
            scheduledFor,
            status: "pending",
          },
        });

        // Queue the email job
        await emailQueue.add(
          "send-reminder-email",
          {
            notificationLogId: notificationLog.id,
            reminderId: reminder.id,
            userId: reminder.userId,
            userEmail: reminder.user.email,
            userName: reminder.user.name,
            reminderTitle: reminder.title,
            ownerName: reminder.ownerName,
            referenceNumber: reminder.referenceNumber,
            providerName: reminder.providerName,
            expiryDate: reminder.expiryDate.toISOString(),
            daysRemaining,
          },
          {
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 5 * 60 * 1000, // 5 minutes initial
            },
          }
        );

        // Also trigger Web Push notification to user devices if subscribed
        sendPushToUser(reminder.userId, {
          title: `RenewIt: ${reminder.title} ⏰`,
          body:
            daysRemaining < 0
              ? `Expired ${Math.abs(daysRemaining)} days ago. Please renew soon!`
              : daysRemaining === 0
              ? `Expires today! Please take action.`
              : `Expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}.`,
          url: `/reminders/${reminder.id}`,
        }).catch((err) => console.error("[reminder-engine push error]", err));

        queued++;
      }

      processed++;
    }

    const duration = Date.now() - startTime;
    console.log(
      `[reminder-engine] Done in ${duration}ms. Processed: ${processed}, Queued: ${queued}, Skipped: ${skipped}`
    );
  } catch (error) {
    console.error("[reminder-engine] Error:", error);
    throw error;
  }
}

/**
 * Process weekly summary emails (sent on configured day/time)
 */
export async function processWeeklySummaries(): Promise<void> {
  console.log("[reminder-engine] Processing weekly summaries...");

  const users = await prisma.user.findMany({
    where: {
      notificationPreferences: {
        weeklySummaryEnabled: true,
        emailEnabled: true,
      },
    },
    include: {
      notificationPreferences: true,
      reminders: {
        where: { status: { not: "deleted" } },
        include: { category: true },
      },
    },
  });

  for (const user of users) {
    const prefs = user.notificationPreferences;
    if (!prefs) continue;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday...

    if (prefs.summaryDay !== dayOfWeek) continue;

    const timezone = user.timezone || "Asia/Kathmandu";

    // Compute reminder statuses
    const enriched = user.reminders.map((r) => ({
      ...r,
      daysRemaining: getDaysRemaining(r.expiryDate, timezone),
    }));

    const nextWeek = enriched.filter((r) => r.daysRemaining >= 0 && r.daysRemaining <= 7);
    const nextMonth = enriched.filter((r) => r.daysRemaining > 7 && r.daysRemaining <= 30);

    if (nextWeek.length === 0 && nextMonth.length === 0) continue;

    await emailQueue.add(
      "send-weekly-summary",
      {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        nextWeek: nextWeek.map((r) => ({
          title: r.title,
          daysRemaining: r.daysRemaining,
          expiryDate: r.expiryDate.toISOString(),
        })),
        nextMonth: nextMonth.map((r) => ({
          title: r.title,
          daysRemaining: r.daysRemaining,
          expiryDate: r.expiryDate.toISOString(),
        })),
      },
      { attempts: 3 }
    );
  }
}
