import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists (don't reveal whether email exists)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      // In production, generate a reset token and send email
      // For now, log the request
      console.log(`Password reset requested for: ${email}`);

      // TODO: Generate reset token, save to DB, send email with reset link
      // const resetToken = crypto.randomUUID();
      // await prisma.passwordResetToken.create({ ... });
      // await sendEmail({ to: email, subject: "Password Reset", ... });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: true }); // Don't reveal errors
  }
}
