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

    // Send acceptance email
    await sendEmail({
      to: application.email,
      subject: "Application Accepted - Berean Bible Academy",
      html: `
        <h2>Congratulations!</h2>
        <p>Dear ${application.firstName} ${application.lastName},</p>
        <p>We are pleased to inform you that your application to <strong>${application.program.name}</strong> at Berean Bible Academy has been accepted.</p>
        <p>Your Student ID is: <strong>${studentId}</strong></p>
        <p>Please log in to your student portal to complete your registration and view your course schedule.</p>
        <p>Welcome to Berean Bible Academy!</p>
        <br/>
        <p>Best regards,<br/>Admissions Office<br/>Berean Bible Academy</p>
      `,
    });

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
