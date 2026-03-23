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

    return NextResponse.json({
      message: "Payment recorded successfully",
      reference,
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
