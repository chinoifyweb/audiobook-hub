import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    // Fetch the subscription and verify it belongs to this user
    const subscription = await prisma.customerSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only cancel your own subscription" },
        { status: 403 }
      );
    }

    if (subscription.status !== "active") {
      return NextResponse.json(
        { error: "Only active subscriptions can be cancelled" },
        { status: 400 }
      );
    }

    // If there's a Paystack subscription code, try to disable it on Paystack
    if (subscription.paystackSubscriptionCode && subscription.paystackEmailToken) {
      try {
        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
        if (PAYSTACK_SECRET_KEY) {
          await fetch("https://api.paystack.co/subscription/disable", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: subscription.paystackSubscriptionCode,
              token: subscription.paystackEmailToken,
            }),
          });
        }
      } catch (paystackError) {
        console.error("Paystack subscription disable error:", paystackError);
        // Continue with local cancellation even if Paystack fails
      }
    }

    // Update subscription status to non_renewing (keeps access until period end)
    const updated = await prisma.customerSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: "non_renewing",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Subscription cancelled successfully. You will have access until the end of your current billing period.",
      subscription: updated,
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
