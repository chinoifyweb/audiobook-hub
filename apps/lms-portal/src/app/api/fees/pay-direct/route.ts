import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { studentProfile } = await requireStudent();
    const { amount } = await request.json();

    if (!amount || amount < 100000) {
      return NextResponse.json(
        { error: "Minimum payment is \u20A61,000" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: studentProfile.userId },
      select: { email: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reference = `TUI-${crypto.randomBytes(8).toString("hex")}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ses.bba.org.ng"}/payments?reference=${reference}`;

    // Try Paystack first
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;

    if (paystackKey) {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount,
          reference,
          callback_url: callbackUrl,
          metadata: {
            studentId: studentProfile.id,
            studentName: user.fullName,
            type: "tuition_payment",
          },
        }),
      });

      const data = await res.json();

      if (data.status && data.data?.authorization_url) {
        // Record pending payment
        const activeSemester = await prisma.semester.findFirst({
          where: { isActive: true },
        });

        // Find or use first available tuition fee
        const tuitionFee = await prisma.tuitionFee.findFirst({
          where: {
            programId: studentProfile.programId,
            isActive: true,
            ...(activeSemester ? { semesterId: activeSemester.id } : {}),
          },
        });

        if (tuitionFee) {
          await prisma.tuitionPayment.create({
            data: {
              studentId: studentProfile.id,
              tuitionFeeId: tuitionFee.id,
              amount,
              paystackReference: reference,
              status: "pending",
              paymentMethod: "paystack",
              paymentPlan: "full",
            },
          });
        }

        return NextResponse.json({
          authorizationUrl: data.data.authorization_url,
          reference: data.data.reference,
        });
      } else {
        return NextResponse.json(
          { error: data.message || "Failed to initialize Paystack payment" },
          { status: 400 }
        );
      }
    }

    // No Paystack key — return test mode message
    return NextResponse.json(
      { error: "Payment gateway is being configured. Please use bank transfer or contact admin." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Direct payment error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
