import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";
import {
  sendEmail,
  getReminderEmailTemplate,
  getWeeklySummaryTemplate,
} from "@/lib/email";
import { formatDate } from "@/lib/utils";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

async function processEmailJob(job: Job) {
  const { name, data } = job;

  if (name === "send-reminder-email") {
    await sendReminderEmail(data);
  } else if (name === "send-weekly-summary") {
    await sendWeeklySummaryEmail(data);
  } else {
    throw new Error(`Unknown job type: ${name}`);
  }
}

async function sendReminderEmail(data: {
  notificationLogId: string;
  reminderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  reminderTitle: string;
  ownerName?: string;
  referenceNumber?: string;
  providerName?: string;
  expiryDate: string;
  daysRemaining: number;
}) {
  const {
    notificationLogId,
    reminderId,
    userEmail,
    userName,
    reminderTitle,
    ownerName,
    referenceNumber,
    providerName,
    expiryDate,
    daysRemaining,
  } = data;

  // Update attempt count
  await prisma.notificationLog.update({
    where: { id: notificationLogId },
    data: { attemptCount: { increment: 1 } },
  });

  const subject =
    daysRemaining < 0
      ? `Expired: Your ${reminderTitle} expired ${Math.abs(daysRemaining)} days ago`
      : daysRemaining === 0
      ? `Expires today: Your ${reminderTitle}`
      : `Reminder: Your ${reminderTitle} expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;

  const { messageId } = await sendEmail({
    to: userEmail,
    subject,
    html: getReminderEmailTemplate({
      name: userName,
      reminderTitle,
      ownerName,
      referenceNumber,
      providerName,
      expiryDate: formatDate(new Date(expiryDate)),
      daysRemaining,
      reminderId,
    }),
  });

  // Mark as sent
  await prisma.notificationLog.update({
    where: { id: notificationLogId },
    data: {
      status: "sent",
      sentAt: new Date(),
      providerMessageId: messageId,
    },
  });

  console.log(`[email-worker] Sent reminder email to ${userEmail} for "${reminderTitle}"`);
}

async function sendWeeklySummaryEmail(data: {
  userId: string;
  userEmail: string;
  userName: string;
  nextWeek: Array<{ title: string; daysRemaining: number; expiryDate: string }>;
  nextMonth: Array<{ title: string; daysRemaining: number; expiryDate: string }>;
}) {
  const { userEmail, userName, nextWeek, nextMonth } = data;

  await sendEmail({
    to: userEmail,
    subject: "Your Renewal Reminder weekly summary",
    html: getWeeklySummaryTemplate({
      name: userName,
      nextWeek: nextWeek.map((r) => ({ ...r, expiryDate: formatDate(new Date(r.expiryDate)) })),
      nextMonth: nextMonth.map((r) => ({ ...r, expiryDate: formatDate(new Date(r.expiryDate)) })),
    }),
  });

  console.log(`[email-worker] Sent weekly summary to ${userEmail}`);
}

// Start the worker
export const emailWorker = new Worker("email-notifications", processEmailJob, {
  connection,
  concurrency: 5,
});

emailWorker.on("completed", (job) => {
  console.log(`[email-worker] Job ${job.id} completed`);
});

emailWorker.on("failed", async (job, err) => {
  console.error(`[email-worker] Job ${job?.id} failed:`, err.message);

  // Update notification log with error
  if (job?.data.notificationLogId) {
    await prisma.notificationLog.update({
      where: { id: job.data.notificationLogId },
      data: {
        errorMessage: err.message,
        status: job.attemptsMade >= (job.opts.attempts || 5) - 1 ? "failed" : "pending",
      },
    });
  }
});
