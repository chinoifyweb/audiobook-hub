import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { initializeTransaction } from "@repo/paystack";
import crypto from "crypto";

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

    const { bookId } = await req.json();

    if (!bookId) {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 }
      );
    }

    // Fetch book with author profile for commission split
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        author: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.status !== "published") {
      return NextResponse.json(
        { error: "Book is not available for purchase" },
        { status: 400 }
      );
    }

    if (book.isFree) {
      return NextResponse.json(
        { error: "This book is free. Use the free claim endpoint instead." },
        { status: 400 }
      );
    }

    // Check if user already owns this book
    const existingAccess = await prisma.userLibrary.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: bookId,
        },
      },
    });

    if (existingAccess && existingAccess.accessType === "purchased") {
      return NextResponse.json(
        { error: "You already own this book" },
        { status: 400 }
      );
    }

    // Calculate amounts
    const price = book.discountPrice ?? book.price;
    const authorCommissionRate = Number(book.author.commissionRate);
    const authorEarnings = Math.round(price * authorCommissionRate);
    const platformFee = price - authorEarnings;

    // Generate unique reference
    const reference = `purchase_${crypto.randomBytes(16).toString("hex")}`;

    // Create pending purchase record
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.user.id,
        bookId: bookId,
        amountPaid: price,
        platformFee: platformFee,
        authorEarnings: authorEarnings,
        paystackReference: reference,
        status: "pending",
      },
    });

    // Initialize Paystack transaction
    const paystackParams: Parameters<typeof initializeTransaction>[0] = {
      email: session.user.email,
      amount: price,
      reference: reference,
      callbackUrl: `${APP_URL}/dashboard?purchased=true`,
      metadata: {
        type: "book_purchase",
        bookId: bookId,
        userId: session.user.id,
        purchaseId: purchase.id,
      },
    };

    // Add subaccount for split payment if author has one
    if (book.author.paystackSubaccountCode) {
      paystackParams.subaccount = book.author.paystackSubaccountCode;
    }

    const paystackResponse = await initializeTransaction(paystackParams);

    return NextResponse.json({
      authorizationUrl: paystackResponse.data.authorization_url,
      reference: reference,
    });
  } catch (error) {
    console.error("Purchase initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize purchase" },
      { status: 500 }
    );
  }
}
