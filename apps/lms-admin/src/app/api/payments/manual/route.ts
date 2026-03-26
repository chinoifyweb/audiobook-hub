import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@repo/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { studentId, tuitionFeeId, amount, notes } = body;

    if (!studentId || !amount) {
      return NextResponse.json(
        { error: "Student ID and amount are required" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { id: true, programId: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Find tuition fee — use provided ID or auto-find for student's program
    let feeId = tuitionFeeId;
    if (!feeId) {
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true },
      });

      const autoFee = await prisma.tuitionFee.findFirst({
        where: {
          programId: student.programId,
          isActive: true,
          ...(activeSemester ? { semesterId: activeSemester.id } : {}),
        },
      });

      if (!autoFee) {
        return NextResponse.json(
          { error: "No tuition fee found for this student's program. Please create one in Fees management first." },
          { status: 404 }
        );
      }
      feeId = autoFee.id;
    }

    const reference = `ADMIN-${crypto.randomBytes(8).toString("hex")}`;

    await prisma.tuitionPayment.create({
      data: {
        studentId,
        tuitionFeeId: feeId,
        amount: parseInt(String(amount), 10),
        paystackReference: reference,
        status: "successful",
        paidAt: new Date(),
        paymentMethod: "manual",
        adminNotes: notes || "Manually recorded by admin",
        reviewedBy: session.user.id,
      },
    });

    // Check if payment is now complete — if so, auto-enroll in courses
    const allPayments = await prisma.tuitionPayment.findMany({
      where: { studentId, tuitionFeeId: feeId, status: "successful" },
    });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const fee = await prisma.tuitionFee.findUnique({ where: { id: feeId } });

    // Check for scholarship discount
    const scholarship = await prisma.$queryRaw<Array<{ approved_percentage: number }>>`
      SELECT approved_percentage FROM scholarship_applications
      WHERE student_id = ${studentId} AND status = 'approved' AND approved_percentage > 0
      ORDER BY created_at DESC LIMIT 1
    `;
    const discountPct = scholarship.length > 0 ? scholarship[0].approved_percentage : 0;
    const totalDue = fee ? fee.amount - Math.round(fee.amount * (discountPct / 100)) : 0;

    let enrolledCount = 0;
    if (fee && totalPaid >= totalDue) {
      // Payment complete — enroll student in all courses for their program this semester
      const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
      if (activeSemester) {
        const courseAssignments = await prisma.courseAssignment.findMany({
          where: {
            semesterId: activeSemester.id,
            isActive: true,
            course: { programId: student.programId },
          },
          select: { id: true },
        });

        for (const ca of courseAssignments) {
          const existing = await prisma.courseEnrollment.findFirst({
            where: { studentId, courseAssignmentId: ca.id },
          });
          if (!existing) {
            await prisma.courseEnrollment.create({
              data: {
                studentId,
                courseAssignmentId: ca.id,
                semesterId: activeSemester.id,
                status: "enrolled",
              },
            });
            enrolledCount++;
          }
        }
      }
    }

    return NextResponse.json({
      message: `Payment recorded successfully.${enrolledCount > 0 ? ` Student enrolled in ${enrolledCount} course(s).` : ""}`,
      reference,
      enrolledCount,
    });
  } catch (error) {
    console.error("Manual payment error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
