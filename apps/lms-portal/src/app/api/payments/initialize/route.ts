import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { initializeTransaction } from "@repo/paystack";
import crypto from "crypto";

export async function GET() {
  try {
    const { studentProfile } = await requireStudent();

    // Get all tuition fees for student's program
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
        payments: {
          where: { studentId: studentProfile.id },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const fees = tuitionFees.map((fee) => ({
      id: fee.id,
      amount: fee.amount,
      description: fee.description,
      dueDate: fee.dueDate,
      program: fee.program,
      semester: fee.semester,
      payment: fee.payments[0]
        ? {
            id: fee.payments[0].id,
            amount: fee.payments[0].amount,
            status: fee.payments[0].status,
            paidAt: fee.payments[0].paidAt,
            paystackReference: fee.payments[0].paystackReference,
            receiptUrl: fee.payments[0].receiptUrl,
          }
        : null,
    }));

    return NextResponse.json({ fees });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { studentProfile } = await requireStudent();
    const { tuitionFeeId } = await request.json();

    if (!tuitionFeeId) {
      return NextResponse.json(
        { error: "Tuition fee ID is required" },
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

    // Check if already paid
    const existingPayment = await prisma.tuitionPayment.findFirst({
      where: {
        studentId: studentProfile.id,
        tuitionFeeId,
        status: "successful",
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "This fee has already been paid" },
        { status: 400 }
      );
    }

    const reference = `TUI-${crypto.randomBytes(8).toString("hex")}`;

    // Create pending payment record
    await prisma.tuitionPayment.create({
      data: {
        studentId: studentProfile.id,
        tuitionFeeId,
        amount: tuitionFee.amount,
        paystackReference: reference,
        status: "pending",
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

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.bba.org.ng"}/payments?reference=${reference}`;

    const result = await initializeTransaction({
      email: user.email,
      amount: tuitionFee.amount,
      reference,
      callbackUrl,
      metadata: {
        studentId: studentProfile.id,
        tuitionFeeId,
        type: "tuition_payment",
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
