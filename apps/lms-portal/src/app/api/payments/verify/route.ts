import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { verifyTransaction } from "@repo/paystack";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    const payment = await prisma.tuitionPayment.findFirst({
      where: { paystackReference: reference },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "successful") {
      return NextResponse.json({ status: "successful", message: "Payment already verified" });
    }

    try {
      const result = await verifyTransaction(reference);

      if (result.data.status === "success") {
        await prisma.tuitionPayment.update({
          where: { id: payment.id },
          data: { status: "successful", paidAt: new Date() },
        });
        return NextResponse.json({ status: "successful", message: "Payment verified!" });
      } else {
        await prisma.tuitionPayment.update({
          where: { id: payment.id },
          data: { status: "failed" },
        });
        return NextResponse.json({ status: "failed", message: "Payment failed" });
      }
    } catch {
      return NextResponse.json({
        status: "pending",
        message: "Payment is being verified. Please check back shortly.",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
