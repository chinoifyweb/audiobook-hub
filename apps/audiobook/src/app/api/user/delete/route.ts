import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user has an active subscription and cancel it
    const subscription = await prisma.customerSubscription.findUnique({
      where: { userId },
    });

    if (subscription && (subscription.status === "active" || subscription.status === "non_renewing")) {
      // Try to disable on Paystack
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
        }
      }
    }

    // Deactivate the user account (soft delete - preserves data integrity)
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${userId}@deleted.account`,
        fullName: "Deleted User",
        phone: null,
        avatarUrl: null,
      },
    });

    // Delete sessions to force logout
    await prisma.session.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      message: "Account has been deleted successfully.",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
