import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { studentProfile } = await requireStudent();
    const {
      tuitionFeeId,
      amount,
      bankName,
      bankReference,
      transferDate,
      receiptUploadUrl,
    } = await request.json();

    if (!tuitionFeeId || !amount || !bankName || !bankReference || !transferDate || !receiptUploadUrl) {
      return NextResponse.json(
        { error: "All fields are required" },
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

    const reference = `BT-${crypto.randomBytes(8).toString("hex")}`;

    // Create pending payment record for bank transfer
    await prisma.tuitionPayment.create({
      data: {
        studentId: studentProfile.id,
        tuitionFeeId,
        amount: parseInt(String(amount), 10),
        paystackReference: reference,
        status: "pending",
        paymentMethod: "bank_transfer",
        bankName,
        bankReference,
        transferDate: new Date(transferDate),
        receiptUploadUrl,
      },
    });

    return NextResponse.json({
      message: "Receipt uploaded successfully. It will be reviewed by admin.",
      reference,
    });
  } catch (error) {
    console.error("Receipt upload error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
