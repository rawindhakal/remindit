import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || (role !== "admin" && role !== "super_admin")) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  }

  try {
    const { to } = await req.json();
    const recipient = to || session.user.email;

    const result = await sendEmail({
      to: recipient,
      subject: "RenewIt Admin: Test Email Delivery",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; rounded-radius: 12px;">
          <h2 style="color: #2563EB;">🔔 RenewIt Email Test</h2>
          <p>This is a test email sent from the RenewIt Super Admin Panel.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p>If you received this message, your email SMTP credentials and delivery pipeline are working properly!</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data: { message: `Test email dispatched to ${recipient}`, result } });
  } catch (error: any) {
    console.error("[admin email-test]", error);
    return NextResponse.json(
      { success: false, error: { code: "EMAIL_ERROR", message: error.message || "Failed to send test email" } },
      { status: 500 }
    );
  }
}
