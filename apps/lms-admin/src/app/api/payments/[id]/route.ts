import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { action, adminNotes } = body;

    const payment = await prisma.tuitionPayment.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.tuitionPayment.update({
        where: { id },
        data: {
          status: "successful",
          paidAt: new Date(),
          adminNotes: adminNotes || "Approved by admin",
          reviewedBy: session.user.id,
        },
      });

      // Auto-enroll student if payment is now complete
      let enrolledCount = 0;
      const allPayments = await prisma.tuitionPayment.findMany({
        where: { studentId: payment.studentId, tuitionFeeId: payment.tuitionFeeId, status: "successful" },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      const fee = await prisma.tuitionFee.findUnique({ where: { id: payment.tuitionFeeId } });
      const student = await prisma.studentProfile.findUnique({
        where: { id: payment.studentId },
        select: { programId: true },
      });

      const scholarship = await prisma.$queryRaw<Array<{ approved_percentage: number }>>`
        SELECT approved_percentage FROM scholarship_applications
        WHERE student_id = ${payment.studentId} AND status = 'approved' AND approved_percentage > 0
        ORDER BY created_at DESC LIMIT 1
      `;
      const discountPct = scholarship.length > 0 ? scholarship[0].approved_percentage : 0;
      const totalDue = fee ? fee.amount - Math.round(fee.amount * (discountPct / 100)) : 0;

      if (fee && student && totalPaid >= totalDue) {
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
              where: { studentId: payment.studentId, courseAssignmentId: ca.id },
            });
            if (!existing) {
              await prisma.courseEnrollment.create({
                data: {
                  studentId: payment.studentId,
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
        message: `Payment approved.${enrolledCount > 0 ? ` Student enrolled in ${enrolledCount} course(s).` : ""}`,
      });
    } else if (action === "reject") {
      await prisma.tuitionPayment.update({
        where: { id },
        data: {
          status: "failed",
          adminNotes: adminNotes || "Rejected by admin",
          reviewedBy: session.user.id,
        },
      });
      return NextResponse.json({ message: "Payment rejected" });
    } else if (action === "edit") {
      const { amount, status: newStatus, notes: editNotes } = body;
      const updateData: Record<string, unknown> = {};
      if (amount !== undefined) updateData.amount = parseInt(String(amount), 10);
      if (newStatus) updateData.status = newStatus;
      if (editNotes !== undefined) updateData.adminNotes = editNotes;
      updateData.reviewedBy = session.user.id;

      await prisma.tuitionPayment.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json({ message: "Payment updated" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const payment = await prisma.tuitionPayment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.tuitionPayment.delete({ where: { id } });
    return NextResponse.json({ message: "Payment deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
