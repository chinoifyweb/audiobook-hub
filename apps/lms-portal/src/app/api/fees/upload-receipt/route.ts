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

    if (!amount || !bankName || !receiptUploadUrl) {
      return NextResponse.json(
        { error: "Amount, bank name, and receipt are required" },
        { status: 400 }
      );
    }

    // Find tuition fee — use provided ID or auto-find for student's program
    let feeId = tuitionFeeId;
    if (!feeId) {
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true },
      });

      const autoFee = await prisma.tuitionFee.findFirst({
        where: {
          programId: studentProfile.programId,
          isActive: true,
          ...(activeSemester ? { semesterId: activeSemester.id } : {}),
        },
      });

      if (autoFee) {
        feeId = autoFee.id;
      } else {
        // No fee record exists — create a generic one so payment can be tracked
        const anyFee = await prisma.tuitionFee.findFirst({
          where: { programId: studentProfile.programId, isActive: true },
        });
        feeId = anyFee?.id || null;
      }
    }

    if (!feeId) {
      return NextResponse.json(
        { error: "No tuition fee found for your program. Please contact admin." },
        { status: 404 }
      );
    }

    const reference = `BT-${crypto.randomBytes(8).toString("hex")}`;

    // Create pending payment record for bank transfer
    await prisma.tuitionPayment.create({
      data: {
        studentId: studentProfile.id,
        tuitionFeeId: feeId,
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
