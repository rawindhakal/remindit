import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("--------------------------------------------------");
    console.log("📧 [DEV EMAIL] Gmail credentials not set in .env");
    console.log("📧 TO:", options.to);
    console.log("📧 SUBJECT:", options.subject);
    console.log("--------------------------------------------------");
    return { messageId: `dev-mock-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `RenewIt <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { messageId: info.messageId };
  } catch (err) {
    console.error("📧 [sendEmail error]:", err);
    return { messageId: `dev-error-${Date.now()}` };
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #1a1a1a;
`;

const buttonStyle = `
  display: inline-block;
  background: #2563EB;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  margin: 20px 0;
`;

const footerStyle = `
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 13px;
`;

function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="background:#f9fafb;margin:0;padding:20px 0;">
      <div style="${baseStyle}">
        <div style="margin-bottom:32px;">
          <span style="font-size:24px;font-weight:700;color:#2563EB;">🔔 RenewIt</span>
        </div>
        ${content}
        <div style="${footerStyle}">
          <p>RenewIt — Never miss a renewal deadline</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color:#2563EB;">Manage notifications</a> · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#2563EB;">Open Dashboard</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getVerifyEmailTemplate(name: string, verifyUrl: string): string {
  return baseTemplate(`
    <h2 style="margin-top:0;">Verify your email address</h2>
    <p>Hi ${name},</p>
    <p>Welcome to RenewIt! Please verify your email address to get started.</p>
    <a href="${verifyUrl}" style="${buttonStyle}">Verify Email</a>
    <p style="color:#6b7280;font-size:14px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
  `);
}

export function getPasswordResetTemplate(name: string, resetUrl: string): string {
  return baseTemplate(`
    <h2 style="margin-top:0;">Reset your password</h2>
    <p>Hi ${name},</p>
    <p>You requested a password reset. Click the button below to set a new password.</p>
    <a href="${resetUrl}" style="${buttonStyle}">Reset Password</a>
    <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
  `);
}

export function getWelcomeEmailTemplate(name: string): string {
  return baseTemplate(`
    <h2 style="margin-top:0;">Welcome to RenewIt! 🎉</h2>
    <p>Hi ${name},</p>
    <p>Your account is verified. You can now start tracking your renewal dates.</p>
    <p>You can track:</p>
    <ul>
      <li>✅ Driving License &amp; Passport</li>
      <li>✅ Vehicle Insurance &amp; Tax</li>
      <li>✅ Software Subscriptions</li>
      <li>✅ Product Warranties</li>
      <li>✅ And much more...</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="${buttonStyle}">Go to Dashboard</a>
  `);
}

export function getReminderEmailTemplate(params: {
  name: string;
  reminderTitle: string;
  ownerName?: string;
  referenceNumber?: string;
  providerName?: string;
  expiryDate: string;
  daysRemaining: number;
  reminderId: string;
}): string {
  const { name, reminderTitle, ownerName, referenceNumber, providerName, expiryDate, daysRemaining, reminderId } = params;

  const isExpired = daysRemaining < 0;
  const isToday = daysRemaining === 0;

  let urgencyColor = "#16a34a"; // green
  if (isToday) urgencyColor = "#dc2626";
  else if (daysRemaining <= 7) urgencyColor = "#dc2626";
  else if (daysRemaining <= 30) urgencyColor = "#d97706";

  const urgencyText = isExpired
    ? `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? "s" : ""} ago`
    : isToday
    ? "Expires today!"
    : `Expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;

  return baseTemplate(`
    <h2 style="margin-top:0;">${isExpired ? "⚠️ Expired:" : "⏰ Reminder:"} ${reminderTitle}</h2>
    <p>Hi ${name},</p>
    <p>${isExpired ? "Your" : "Your"} <strong>${reminderTitle}</strong> ${isExpired ? "has expired." : "is expiring soon."}</p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
      <div style="color:${urgencyColor};font-size:20px;font-weight:700;margin-bottom:8px;">${urgencyText}</div>
      <div style="color:#374151;"><strong>Expiry date:</strong> ${expiryDate}</div>
      ${ownerName ? `<div style="color:#374151;margin-top:4px;"><strong>Name:</strong> ${ownerName}</div>` : ""}
      ${referenceNumber ? `<div style="color:#374151;margin-top:4px;"><strong>Reference:</strong> ${referenceNumber}</div>` : ""}
      ${providerName ? `<div style="color:#374151;margin-top:4px;"><strong>Provider:</strong> ${providerName}</div>` : ""}
    </div>

    <p>Please renew it ${isExpired ? "as soon as possible" : "before the expiry date"} to avoid any inconvenience.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/reminders/${reminderId}" style="${buttonStyle}">View Reminder</a>
  `);
}

export function getWeeklySummaryTemplate(params: {
  name: string;
  nextWeek: Array<{ title: string; daysRemaining: number; expiryDate: string }>;
  nextMonth: Array<{ title: string; daysRemaining: number; expiryDate: string }>;
}): string {
  const { name, nextWeek, nextMonth } = params;

  const listItem = (item: { title: string; daysRemaining: number; expiryDate: string }) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
        <strong>${item.title}</strong>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#d97706;">
        ${item.daysRemaining === 0 ? "Today!" : `${item.daysRemaining} days`}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#6b7280;font-size:13px;">
        ${item.expiryDate}
      </td>
    </tr>
  `;

  return baseTemplate(`
    <h2 style="margin-top:0;">Your Weekly Renewal Summary</h2>
    <p>Hi ${name}, here's what's coming up:</p>

    ${nextWeek.length > 0 ? `
      <h3 style="color:#dc2626;">⚠ Next 7 Days</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${nextWeek.map(listItem).join("")}
      </table>
    ` : ""}

    ${nextMonth.length > 0 ? `
      <h3 style="color:#d97706;margin-top:24px;">📅 Next 30 Days</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${nextMonth.map(listItem).join("")}
      </table>
    ` : ""}

    ${nextWeek.length === 0 && nextMonth.length === 0 ? `
      <p style="color:#16a34a;font-weight:600;">✅ All clear — nothing expiring in the next 30 days.</p>
    ` : ""}

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="${buttonStyle}">Open Dashboard</a>
  `);
}

export function getRenewalConfirmationTemplate(params: {
  name: string;
  reminderTitle: string;
  previousExpiry: string;
  newExpiry: string;
}): string {
  const { name, reminderTitle, previousExpiry, newExpiry } = params;

  return baseTemplate(`
    <h2 style="margin-top:0;">✅ Renewal Confirmed</h2>
    <p>Hi ${name},</p>
    <p>Your <strong>${reminderTitle}</strong> has been renewed successfully.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
      <div><strong>Previous expiry:</strong> <span style="text-decoration:line-through;color:#6b7280;">${previousExpiry}</span></div>
      <div style="margin-top:8px;"><strong>New expiry:</strong> <span style="color:#16a34a;font-weight:700;">${newExpiry}</span></div>
    </div>

    <p>We'll remind you again before the new expiry date.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="${buttonStyle}">Go to Dashboard</a>
  `);
}
