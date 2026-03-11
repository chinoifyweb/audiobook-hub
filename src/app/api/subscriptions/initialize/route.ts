import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initializeTransaction } from "@/lib/paystack";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Fetch the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: "This plan is no longer available" },
        { status: 400 }
      );
    }

    if (!plan.paystackPlanCode) {
      return NextResponse.json(
        { error: "Plan is not configured for payments" },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription =
      await prisma.customerSubscription.findUnique({
        where: { userId: session.user.id },
      });

    if (
      existingSubscription &&
      (existingSubscription.status === "active" ||
        existingSubscription.status === "non_renewing")
    ) {
      return NextResponse.json(
        {
          error:
            "You already have an active subscription. Please cancel it first to switch plans.",
        },
        { status: 400 }
      );
    }

    // Initialize Paystack transaction with plan code
    // Paystack handles recurring billing when a plan is provided
    const paystackResponse = await initializeTransaction({
      email: session.user.email,
      amount: plan.price,
      callbackUrl: `${APP_URL}/dashboard/subscription?subscribed=true`,
      metadata: {
        type: "subscription",
        planId: plan.id,
        userId: session.user.id,
        planCode: plan.paystackPlanCode,
      },
    });

    return NextResponse.json({
      authorizationUrl: paystackResponse.data.authorization_url,
    });
  } catch (error) {
    console.error("Subscription initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize subscription" },
      { status: 500 }
    );
  }
}
