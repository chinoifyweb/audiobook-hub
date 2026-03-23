import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { verifyTransaction } from "@repo/paystack";

async function autoEnrollStudent(studentId: string, tuitionFeeId: string) {
  try {
    // Get all successful payments for this fee
    const allPayments = await prisma.tuitionPayment.findMany({
      where: { studentId, tuitionFeeId, status: "successful" },
    });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const fee = await prisma.tuitionFee.findUnique({ where: { id: tuitionFeeId } });
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { programId: true },
    });

    if (!fee || !student) return 0;

    // Check scholarship discount
    const scholarship = await prisma.$queryRaw<Array<{ approved_percentage: number }>>`
      SELECT approved_percentage FROM scholarship_applications
      WHERE student_id = ${studentId} AND status = 'approved' AND approved_percentage > 0
      ORDER BY created_at DESC LIMIT 1
    `;
    const discountPct = scholarship.length > 0 ? scholarship[0].approved_percentage : 0;
    const totalDue = fee.amount - Math.round(fee.amount * (discountPct / 100));

    if (totalPaid < totalDue) return 0;

    // Payment complete — enroll in courses
    const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
    if (!activeSemester) return 0;

    const courseAssignments = await prisma.courseAssignment.findMany({
      where: {
        semesterId: activeSemester.id,
        isActive: true,
        course: { programId: student.programId },
      },
      select: { id: true },
    });

    let enrolled = 0;
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
            status: "active",
          },
        });
        enrolled++;
      }
    }
    return enrolled;
  } catch (e) {
    console.error("Auto-enroll error:", e);
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    const payment = await prisma.tuitionPayment.findFirst({
      where: { paystackReference: reference },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "successful") {
      return NextResponse.json({ status: "successful", message: "Payment already verified" });
    }

    try {
      const result = await verifyTransaction(reference);

      if (result.data.status === "success") {
        await prisma.tuitionPayment.update({
          where: { id: payment.id },
          data: { status: "successful", paidAt: new Date() },
        });

        // Auto-enroll student in courses if fully paid
        const enrolledCount = await autoEnrollStudent(payment.studentId, payment.tuitionFeeId);

        return NextResponse.json({
          status: "successful",
          message: `Payment verified!${enrolledCount > 0 ? ` You have been enrolled in ${enrolledCount} course(s).` : ""}`,
          enrolledCount,
        });
      } else {
        await prisma.tuitionPayment.update({
          where: { id: payment.id },
          data: { status: "failed" },
        });
        return NextResponse.json({ status: "failed", message: "Payment failed" });
      }
    } catch {
      return NextResponse.json({
        status: "pending",
        message: "Payment is being verified. Please check back shortly.",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
