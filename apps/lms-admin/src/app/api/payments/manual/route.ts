import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@repo/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { studentId, tuitionFeeId, amount, notes } = body;

    if (!studentId || !tuitionFeeId || !amount) {
      return NextResponse.json(
        { error: "Student ID, tuition fee ID, and amount are required" },
        { status: 400 }
      );
    }

    // Verify student and fee exist
    const [student, fee] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { id: studentId } }),
      prisma.tuitionFee.findUnique({ where: { id: tuitionFeeId } }),
    ]);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!fee) {
      return NextResponse.json({ error: "Tuition fee not found" }, { status: 404 });
    }

    const reference = `ADMIN-${crypto.randomBytes(8).toString("hex")}`;

    await prisma.tuitionPayment.create({
      data: {
        studentId,
        tuitionFeeId,
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
