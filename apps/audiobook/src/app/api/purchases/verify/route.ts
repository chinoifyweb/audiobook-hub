import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { verifyTransaction } from "@repo/paystack";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const reference = req.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "reference is required" },
        { status: 400 }
      );
    }

    // Find the purchase record
    const purchase = await prisma.purchase.findUnique({
      where: { paystackReference: reference },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    // Ensure the purchase belongs to the requesting user
    if (purchase.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If already processed, return current state
    if (purchase.status === "successful") {
      return NextResponse.json({
        success: true,
        purchase: {
          id: purchase.id,
          status: purchase.status,
          bookId: purchase.bookId,
        },
      });
    }

    // Verify with Paystack
    const verification = await verifyTransaction(reference);

    if (verification.data.status === "success") {
      // Update purchase and add to library in a transaction
      const [updatedPurchase] = await prisma.$transaction([
        prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            status: "successful",
            paystackTransactionId: String(verification.data.id),
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

      return NextResponse.json({
        success: true,
        purchase: {
          id: updatedPurchase.id,
          status: updatedPurchase.status,
          bookId: updatedPurchase.bookId,
        },
      });
    } else {
      // Payment was not successful
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: "failed" },
      });

      return NextResponse.json({
        success: false,
        purchase: {
          id: purchase.id,
          status: "failed",
          bookId: purchase.bookId,
        },
      });
    }
  } catch (error) {
    console.error("Purchase verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify purchase" },
      { status: 500 }
    );
  }
}
