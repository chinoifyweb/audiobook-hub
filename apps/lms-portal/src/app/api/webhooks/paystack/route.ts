import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { verifyWebhookSignature } from "@repo/paystack";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case "charge.success": {
        const { reference, metadata } = event.data;

        // Only handle tuition payments
        if (metadata?.type !== "tuition_payment") {
          break;
        }

        const payment = await prisma.tuitionPayment.findUnique({
          where: { paystackReference: reference },
        });

        if (payment && payment.status !== "successful") {
          await prisma.tuitionPayment.update({
            where: { id: payment.id },
            data: {
              status: "successful",
              paystackTransactionId: String(event.data.id),
              paidAt: new Date(),
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
