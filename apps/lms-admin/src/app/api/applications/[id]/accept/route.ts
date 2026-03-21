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

    const application = await prisma.lmsApplication.findUnique({
      where: { id: params.id },
      include: {
        program: true,
        user: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "submitted" && application.status !== "under_review") {
      return NextResponse.json(
        { error: "Application cannot be accepted in its current state" },
        { status: 400 }
      );
    }

    // Generate student ID: BBA/STU/YYYY/NNNN
    const year = new Date().getFullYear();
    const lastStudent = await prisma.studentProfile.findFirst({
      where: {
        studentId: { startsWith: `BBA/STU/${year}/` },
      },
      orderBy: { studentId: "desc" },
    });

    let nextNum = 1;
    if (lastStudent) {
      const parts = lastStudent.studentId.split("/");
      nextNum = parseInt(parts[3], 10) + 1;
    }
    const studentId = `BBA/STU/${year}/${String(nextNum).padStart(4, "0")}`;

    // Calculate expected graduation
    const semesterDuration = application.program.durationSemesters;
    const expectedGraduation = new Date();
    expectedGraduation.setMonth(expectedGraduation.getMonth() + semesterDuration * 6);

    // Transaction: create student profile, update user role, update application status
    await prisma.$transaction([
      prisma.studentProfile.create({
        data: {
          userId: application.userId,
          studentId,
          programId: application.programId,
          applicationId: application.id,
          currentSemester: 1,
          expectedGraduation,
          status: "active",
        },
      }),
      prisma.user.update({
        where: { id: application.userId },
        data: { role: "student" },
      }),
      prisma.lmsApplication.update({
        where: { id: application.id },
        data: {
          status: "accepted",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        },
      }),
    ]);

    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || "https://ses.bba.org.ng";
    const trackingUrl = application.trackingCode
      ? `${portalUrl}/application/track/${application.trackingCode}`
      : `${portalUrl}/application/status`;

    // Send acceptance email with full details
    await sendEmail({
      to: application.email,
      subject: "Admission Approved! - Berean Bible Academy",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Berean Bible Academy</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Admission Notification</p>
          </div>

          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
              <h2 style="color: #166534; margin: 0 0 8px;">🎓 Congratulations!</h2>
              <p style="color: #15803d; margin: 0;">Your admission has been approved.</p>
            </div>

            <p>Dear <strong>${application.firstName} ${application.lastName}</strong>,</p>

            <p>We are delighted to inform you that your application to Berean Bible Academy has been <strong>accepted</strong>.</p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px; color: #1e40af;">Your Admission Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Student ID:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #2563eb; font-size: 18px;">${studentId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Application No:</td>
                  <td style="padding: 6px 0; font-weight: bold;">${application.applicationNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Program:</td>
                  <td style="padding: 6px 0; font-weight: bold;">${application.program.name} (${application.program.code})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Login Email:</td>
                  <td style="padding: 6px 0; font-weight: bold;">${application.email}</td>
                </tr>
              </table>
            </div>

            <h3 style="color: #1e40af;">Next Steps:</h3>
            <ol style="padding-left: 20px; color: #374151;">
              <li style="margin-bottom: 8px;">Visit the Student Portal: <a href="${portalUrl}/login" style="color: #2563eb;">${portalUrl}/login</a></li>
              <li style="margin-bottom: 8px;">Log in using your email (${application.email}) and password</li>
              <li style="margin-bottom: 8px;">Complete your tuition payment from the dashboard</li>
              <li style="margin-bottom: 8px;">Access your courses, materials, and class schedule</li>
            </ol>

            <div style="margin-top: 24px; text-align: center;">
              <a href="${portalUrl}/login" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Log in to Student Portal</a>
            </div>

            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, contact us at admissions@bba.org.ng or WhatsApp: +234 902 767 7276
            </p>

            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br/>
              <strong>Admissions Office</strong><br/>
              Berean Bible Academy
            </p>
          </div>
        </div>
      `,
    });

    // Send WhatsApp notification if number is available
    if (application.whatsappNumber) {
      const whatsappMessage = encodeURIComponent(
        `🎓 *ADMISSION APPROVED - Berean Bible Academy*\n\n` +
        `Dear ${application.firstName} ${application.lastName},\n\n` +
        `Congratulations! Your admission to *${application.program.name}* has been approved.\n\n` +
        `📋 *Your Details:*\n` +
        `• Student ID: *${studentId}*\n` +
        `• Application: ${application.applicationNumber}\n` +
        `• Program: ${application.program.name}\n` +
        `• Login Email: ${application.email}\n\n` +
        `🔗 *Next Steps:*\n` +
        `1. Log in at: ${portalUrl}/login\n` +
        `2. Complete tuition payment\n` +
        `3. Access your courses\n\n` +
        `Track your status: ${trackingUrl}\n\n` +
        `Welcome to BBA! 🎉`
      );

      // Log WhatsApp message for manual sending (or integrate with WhatsApp Business API)
      console.log(`WhatsApp notification for ${application.whatsappNumber}: https://wa.me/${application.whatsappNumber.replace(/[^0-9]/g, "")}?text=${whatsappMessage}`);
    }

    return NextResponse.json({ success: true, studentId });
  } catch (error) {
    console.error("Accept application error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to accept application" }, { status: 500 });
  }
}
