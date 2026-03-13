import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { PaymentReceiptPDF } from "@repo/pdf";
import type { PaymentReceiptData } from "@repo/pdf";
import { format } from "date-fns";
import React from "react";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentProfile } = await requireStudent();

    const payment = await prisma.tuitionPayment.findUnique({
      where: { id: params.id },
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
            program: true,
          },
        },
        tuitionFee: {
          include: {
            semester: {
              include: { session: true },
            },
            program: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Ensure student can only access their own payments
    if (payment.studentId !== studentProfile.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only access your own payment receipts" },
        { status: 403 }
      );
    }

    const receiptNumber = `BBA/RCT/${format(
      new Date(payment.createdAt),
      "yyyy"
    )}/${payment.id.slice(-6).toUpperCase()}`;

    const data: PaymentReceiptData = {
      studentName: payment.student.user.fullName || "N/A",
      studentId: studentProfile.studentId,
      programName: payment.student.program.name,
      paymentDescription:
        payment.tuitionFee.description ||
        `Tuition Fee - ${payment.tuitionFee.semester.name}`,
      amount: payment.amount,
      paymentDate: payment.paidAt
        ? format(new Date(payment.paidAt), "MMMM d, yyyy 'at' h:mm a")
        : format(new Date(payment.createdAt), "MMMM d, yyyy 'at' h:mm a"),
      paymentReference: payment.paystackReference || "N/A",
      transactionId: payment.paystackTransactionId || undefined,
      status: payment.status,
      semesterName: payment.tuitionFee.semester.name,
      sessionName: payment.tuitionFee.semester.session.name,
      receiptNumber,
    };

    const buffer = await renderToBuffer(
      React.createElement(PaymentReceiptPDF, { data }) as any
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${receiptNumber.replace(/\//g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("Forbidden")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
