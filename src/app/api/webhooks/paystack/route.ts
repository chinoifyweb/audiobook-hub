import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature || !verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const { event: eventType, data } = event;

    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(data);
        break;
      case "subscription.create":
        await handleSubscriptionCreate(data);
        break;
      case "subscription.disable":
        await handleSubscriptionDisable(data);
        break;
      case "subscription.not_renew":
        await handleSubscriptionNotRenew(data);
        break;
      case "transfer.success":
        await handleTransferSuccess(data);
        break;
      case "transfer.failed":
        await handleTransferFailed(data);
        break;
      default:
        console.log(`Unhandled Paystack event: ${eventType}`);
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

async function handleChargeSuccess(data: Record<string, unknown>) {
  const reference = data.reference as string;
  const metadata = data.metadata as Record<string, unknown> | undefined;

  // Check if this is a book purchase
  if (metadata?.type === "book_purchase") {
    const purchase = await prisma.purchase.findUnique({
      where: { paystackReference: reference },
    });

    if (purchase && purchase.status !== "successful") {
      await prisma.$transaction([
        prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            status: "successful",
            paystackTransactionId: String(data.id),
            purchasedAt: new Date(),
          },
        }),
        prisma.userLibrary.create({
          data: {
            userId: purchase.userId,
            bookId: purchase.bookId,
            accessType: "purchased",
          },
        }),
      ]);
    }
  }
}

async function handleSubscriptionCreate(data: Record<string, unknown>) {
  const subscriptionCode = data.subscription_code as string;
  const emailToken = data.email_token as string;
  const customer = data.customer as Record<string, unknown>;
  const plan = data.plan as Record<string, unknown>;

  const user = await prisma.user.findUnique({
    where: { email: customer.email as string },
  });

  if (!user) return;

  const dbPlan = await prisma.subscriptionPlan.findFirst({
    where: { paystackPlanCode: plan.plan_code as string },
  });

  if (!dbPlan) return;

  await prisma.customerSubscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      planId: dbPlan.id,
      paystackSubscriptionCode: subscriptionCode,
      paystackEmailToken: emailToken,
      status: "active",
      currentPeriodStart: new Date(),
      nextPaymentDate: data.next_payment_date
        ? new Date(data.next_payment_date as string)
        : null,
    },
    update: {
      planId: dbPlan.id,
      paystackSubscriptionCode: subscriptionCode,
      paystackEmailToken: emailToken,
      status: "active",
      currentPeriodStart: new Date(),
      nextPaymentDate: data.next_payment_date
        ? new Date(data.next_payment_date as string)
        : null,
    },
  });
}

async function handleSubscriptionDisable(data: Record<string, unknown>) {
  const subscriptionCode = data.subscription_code as string;

  await prisma.customerSubscription.updateMany({
    where: { paystackSubscriptionCode: subscriptionCode },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
}

async function handleSubscriptionNotRenew(data: Record<string, unknown>) {
  const subscriptionCode = data.subscription_code as string;

  await prisma.customerSubscription.updateMany({
    where: { paystackSubscriptionCode: subscriptionCode },
    data: { status: "non_renewing" },
  });
}

async function handleTransferSuccess(data: Record<string, unknown>) {
  const reference = data.reference as string;

  await prisma.authorPayout.updateMany({
    where: { paystackTransferReference: reference },
    data: { status: "paid", paidAt: new Date() },
  });
}

async function handleTransferFailed(data: Record<string, unknown>) {
  const reference = data.reference as string;

  await prisma.authorPayout.updateMany({
    where: { paystackTransferReference: reference },
    data: { status: "failed" },
  });
}
