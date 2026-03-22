import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    const { studentProfile } = await requireStudent();

    // Get active semester
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
      include: { session: true },
    });

    if (!activeSemester) {
      return NextResponse.json({ fees: [], scholarship: null });
    }

    // Get tuition fees for student's program
    const tuitionFees = await prisma.tuitionFee.findMany({
      where: {
        programId: studentProfile.programId,
        isActive: true,
      },
      include: {
        program: { select: { name: true } },
        semester: {
          include: { session: { select: { name: true } } },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    // Get all payments for this student
    const allPayments = await prisma.tuitionPayment.findMany({
      where: {
        studentId: studentProfile.id,
      },
      orderBy: { createdAt: "desc" },
    });

    // Check for approved scholarship
    const approvedScholarship = await prisma.$queryRaw<
      Array<{
        approved_percentage: number;
        scholarship_type: string;
      }>
    >`
      SELECT approved_percentage, scholarship_type
      FROM scholarship_applications
      WHERE student_id = ${studentProfile.id}
      AND status = 'approved'
      AND approved_percentage > 0
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const scholarshipInfo = approvedScholarship.length > 0
      ? {
          hasApprovedScholarship: true,
          approvedPercentage: approvedScholarship[0].approved_percentage,
          discountAmount: 0, // Will be calculated per fee
        }
      : {
          hasApprovedScholarship: false,
          approvedPercentage: 0,
          discountAmount: 0,
        };

    // Build fee statuses
    const fees = tuitionFees.map((fee) => {
      const feePayments = allPayments
        .filter((p) => p.tuitionFeeId === fee.id)
        .map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          paidAt: p.paidAt,
          paystackReference: p.paystackReference,
          receiptUrl: p.receiptUrl,
          paymentMethod: p.paymentMethod,
          installmentNumber: p.installmentNumber,
          paymentPlan: p.paymentPlan,
          bankName: p.bankName,
          bankReference: p.bankReference,
          receiptUploadUrl: p.receiptUploadUrl,
          createdAt: p.createdAt,
        }));

      const totalPaid = feePayments
        .filter((p) => p.status === "successful")
        .reduce((sum, p) => sum + p.amount, 0);

      const scholarshipDiscount = scholarshipInfo.hasApprovedScholarship
        ? Math.round(fee.amount * (scholarshipInfo.approvedPercentage / 100))
        : 0;

      const totalDue = fee.amount - scholarshipDiscount;
      const balance = Math.max(0, totalDue - totalPaid);

      // Update scholarship discount amount for the current fee
      if (scholarshipInfo.hasApprovedScholarship) {
        scholarshipInfo.discountAmount = scholarshipDiscount;
      }

      return {
        feeId: fee.id,
        fee: {
          id: fee.id,
          amount: fee.amount,
          description: fee.description,
          dueDate: fee.dueDate,
          program: fee.program,
          semester: fee.semester,
        },
        totalDue,
        totalPaid,
        balance,
        scholarshipDiscount,
        payments: feePayments,
      };
    });

    return NextResponse.json({ fees, scholarship: scholarshipInfo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
