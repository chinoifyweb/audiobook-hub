import { NextResponse } from "next/server";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature || !verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
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
    // Return 200 even on errors to prevent Paystack from retrying
    // Log the error for investigation
    return NextResponse.json({ received: true });
  }
}

// ─── charge.success ──────────────────────────────────────────────────────────

async function handleChargeSuccess(data: Record<string, unknown>) {
  const reference = data.reference as string;
  const metadata = data.metadata as Record<string, unknown> | undefined;

  if (!reference) return;

  // Verify the transaction with Paystack to ensure authenticity
  let verification;
  try {
    verification = await verifyTransaction(reference);
  } catch {
    console.error(
      `Failed to verify transaction ${reference} with Paystack API`
    );
    return;
  }

  if (verification.data.status !== "success") return;

  // Determine if this is a book purchase or subscription payment
  const type = metadata?.type as string | undefined;

  if (type === "book_purchase") {
    await processBookPurchase(reference, data);
  } else if (type === "subscription") {
    // Subscription charges are handled by subscription.create event
    // But we can still update the subscription status here for renewals
    await processSubscriptionCharge(data);
  }
}

async function processBookPurchase(
  reference: string,
  data: Record<string, unknown>
) {
  // Idempotency: check if already processed
  const purchase = await prisma.purchase.findUnique({
    where: { paystackReference: reference },
  });

  if (!purchase || purchase.status === "successful") {
    return; // Already processed or not found
  }

  await prisma.$transaction([
    prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: "successful",
        paystackTransactionId: String(data.id),
        purchasedAt: new Date(),
      },
    }),
    prisma.userLibrary.upsert({
      where: {
        userId_bookId: {
          userId: purchase.userId,
          bookId: purchase.bookId,
        },
      },
      create: {
        userId: purchase.userId,
        bookId: purchase.bookId,
        accessType: "purchased",
      },
      update: {
        accessType: "purchased",
      },
    }),
    // Update author earnings
    prisma.authorProfile.updateMany({
      where: {
        books: {
          some: { id: purchase.bookId },
        },
      },
      data: {
        totalEarnings: {
          increment: purchase.authorEarnings,
        },
      },
    }),
  ]);
}

async function processSubscriptionCharge(data: Record<string, unknown>) {
  const customer = data.customer as Record<string, unknown> | undefined;
  if (!customer?.email) return;

  const user = await prisma.user.findUnique({
    where: { email: customer.email as string },
  });

  if (!user) return;

  // Update the subscription period on successful renewal charge
  const subscription = await prisma.customerSubscription.findUnique({
    where: { userId: user.id },
  });

  if (subscription && subscription.status === "active") {
    await prisma.customerSubscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodStart: new Date(),
        status: "active",
      },
    });
  }
}

// ─── subscription.create ─────────────────────────────────────────────────────

async function handleSubscriptionCreate(data: Record<string, unknown>) {
  const subscriptionCode = data.subscription_code as string;
  const emailToken = data.email_token as string;
  const customer = data.customer as Record<string, unknown>;
  const plan = data.plan as Record<string, unknown>;

  if (!customer?.email || !plan?.plan_code) return;

  const user = await prisma.user.findUnique({
    where: { email: customer.email as string },
  });

  if (!user) return;

  const dbPlan = await prisma.subscriptionPlan.findFirst({
    where: { paystackPlanCode: plan.plan_code as string },
  });

  if (!dbPlan) return;

  // Idempotency: check if subscription with this code already exists
  const existing = await prisma.customerSubscription.findFirst({
    where: { paystackSubscriptionCode: subscriptionCode },
  });

  if (existing && existing.status === "active") {
    return; // Already processed
  }

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
      cancelledAt: null,
      nextPaymentDate: data.next_payment_date
        ? new Date(data.next_payment_date as string)
        : null,
    },
  });
}

// ─── subscription.disable ────────────────────────────────────────────────────

async function handleSubscriptionDisable(data: Record<string, unknown>) {
  const subscriptionCode = data.subscription_code as string;

  if (!subscriptionCode) return;

  // Idempotency: only update if not already cancelled
  await prisma.customerSubscription.updateMany({
    where: {
      paystackSubscriptionCode: subscriptionCode,
      status: { not: "cancelled" },
    },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
}

// ─── subscription.not_renew ──────────────────────────────────────────────────

async function handleSubscriptionNotRenew(data: Record<string, unknown>) {
  const subscriptionCode = data.subscription_code as string;

  if (!subscriptionCode) return;

  await prisma.customerSubscription.updateMany({
    where: {
      paystackSubscriptionCode: subscriptionCode,
      status: { not: "non_renewing" },
    },
    data: { status: "non_renewing" },
  });
}

// ─── transfer.success ────────────────────────────────────────────────────────

async function handleTransferSuccess(data: Record<string, unknown>) {
  const reference = data.reference as string;

  if (!reference) return;

  // Idempotency: only update if not already paid
  await prisma.authorPayout.updateMany({
    where: {
      paystackTransferReference: reference,
      status: { not: "paid" },
    },
    data: { status: "paid", paidAt: new Date() },
  });
}

// ─── transfer.failed ─────────────────────────────────────────────────────────

async function handleTransferFailed(data: Record<string, unknown>) {
  const reference = data.reference as string;

  if (!reference) return;

  await prisma.authorPayout.updateMany({
    where: {
      paystackTransferReference: reference,
      status: { not: "failed" },
    },
    data: { status: "failed" },
  });
}
