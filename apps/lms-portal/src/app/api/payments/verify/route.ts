import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import { verifyTransaction } from "@repo/paystack";

export async function GET(request: Request) {
  try {
    const { studentProfile } = await requireStudent();
    const url = new URL(request.url);
    const reference = url.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    // Find the payment
    const payment = await prisma.tuitionPayment.findUnique({
      where: { paystackReference: reference },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.studentId !== studentProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (payment.status === "successful") {
      return NextResponse.json({
        message: "Payment already verified",
        status: "successful",
      });
    }

    // Verify with Paystack
    const result = await verifyTransaction(reference);

    if (result.data.status === "success") {
      await prisma.tuitionPayment.update({
        where: { id: payment.id },
        data: {
          status: "successful",
          paystackTransactionId: String(result.data.id),
          paidAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "Payment verified successfully",
        status: "successful",
      });
    } else {
      await prisma.tuitionPayment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });

      return NextResponse.json({
        message: "Payment failed",
        status: "failed",
      });
    }
  } catch (error) {
    console.error("Payment verify error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
