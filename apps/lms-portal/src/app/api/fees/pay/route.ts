import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { initializeTransaction } from "@repo/paystack";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { studentProfile } = await requireStudent();
    const { tuitionFeeId, amount, installmentNumber, paymentPlan } = await request.json();

    if (!tuitionFeeId || !amount) {
      return NextResponse.json(
        { error: "Tuition fee ID and amount are required" },
        { status: 400 }
      );
    }

    const tuitionFee = await prisma.tuitionFee.findUnique({
      where: { id: tuitionFeeId },
    });

    if (!tuitionFee) {
      return NextResponse.json(
        { error: "Tuition fee not found" },
        { status: 404 }
      );
    }

    // Check scholarship discount
    const approvedScholarship = await prisma.$queryRaw<
      Array<{ approved_percentage: number }>
    >`
      SELECT approved_percentage
      FROM scholarship_applications
      WHERE student_id = ${studentProfile.id}
      AND status = 'approved'
      AND approved_percentage > 0
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const scholarshipDiscount = approvedScholarship.length > 0
      ? Math.round(tuitionFee.amount * (approvedScholarship[0].approved_percentage / 100))
      : 0;

    const totalDue = tuitionFee.amount - scholarshipDiscount;

    // Get total already paid
    const existingPayments = await prisma.tuitionPayment.findMany({
      where: {
        studentId: studentProfile.id,
        tuitionFeeId,
        status: "successful",
      },
    });

    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, totalDue - totalPaid);

    if (balance <= 0) {
      return NextResponse.json(
        { error: "This fee has already been fully paid" },
        { status: 400 }
      );
    }

    // Validate amount doesn't exceed balance
    if (amount > balance) {
      return NextResponse.json(
        { error: `Amount exceeds outstanding balance of ${balance}` },
        { status: 400 }
      );
    }

    const reference = `TUI-${crypto.randomBytes(8).toString("hex")}`;

    // Create pending payment record
    await prisma.tuitionPayment.create({
      data: {
        studentId: studentProfile.id,
        tuitionFeeId,
        amount: parseInt(String(amount), 10),
        paystackReference: reference,
        status: "pending",
        paymentMethod: "paystack",
        installmentNumber: installmentNumber || null,
        paymentPlan: paymentPlan || "full",
      },
    });

    // Get student email
    const user = await prisma.user.findUnique({
      where: { id: studentProfile.userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ses.bba.org.ng"}/payments?reference=${reference}`;

    const result = await initializeTransaction({
      email: user.email,
      amount: parseInt(String(amount), 10),
      reference,
      callbackUrl,
      metadata: {
        studentId: studentProfile.id,
        tuitionFeeId,
        type: "tuition_payment",
        installmentNumber: installmentNumber || 1,
        paymentPlan: paymentPlan || "full",
      },
    });

    return NextResponse.json({
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    console.error("Payment init error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
