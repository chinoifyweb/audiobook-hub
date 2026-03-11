import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Fetch the book and verify it is free
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.status !== "published") {
      return NextResponse.json(
        { error: "Book is not available" },
        { status: 400 }
      );
    }

    if (!book.isFree) {
      return NextResponse.json(
        { error: "This book is not free" },
        { status: 400 }
      );
    }

    // Check if already in library
    const existingAccess = await prisma.userLibrary.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: bookId,
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json(
        { error: "Book is already in your library" },
        { status: 400 }
      );
    }

    // Add to user library
    await prisma.userLibrary.create({
      data: {
        userId: session.user.id,
        bookId: bookId,
        accessType: "purchased",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Free book claim error:", error);
    return NextResponse.json(
      { error: "Failed to claim free book" },
      { status: 500 }
    );
  }
}
