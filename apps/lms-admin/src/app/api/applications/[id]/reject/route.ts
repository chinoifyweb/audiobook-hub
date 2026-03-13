import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { sendEmail } from "@repo/email";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const application = await prisma.lmsApplication.findUnique({
      where: { id: params.id },
      include: { program: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "submitted" && application.status !== "under_review") {
      return NextResponse.json(
        { error: "Application cannot be rejected in its current state" },
        { status: 400 }
      );
    }

    await prisma.lmsApplication.update({
      where: { id: application.id },
      data: {
        status: "rejected",
        rejectionReason: reason.trim(),
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    // Send rejection email
    await sendEmail({
      to: application.email,
      subject: "Application Update - Berean Bible Academy",
      html: `
        <h2>Application Update</h2>
        <p>Dear ${application.firstName} ${application.lastName},</p>
        <p>Thank you for your interest in <strong>${application.program.name}</strong> at Berean Bible Academy.</p>
        <p>After careful review, we regret to inform you that your application has not been successful at this time.</p>
        <p><strong>Reason:</strong> ${reason.trim()}</p>
        <p>You are welcome to reapply in future admission cycles.</p>
        <br/>
        <p>Best regards,<br/>Admissions Office<br/>Berean Bible Academy</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject application error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });
  }
}
