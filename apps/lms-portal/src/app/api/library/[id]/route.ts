import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    const book = await prisma.libraryBook.findUnique({
      where: { id: params.id, isActive: true },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // If book is not public, require student login
    if (!book.isPublic && !session?.user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    return NextResponse.json({
      ...book,
      fileSize: book.fileSize.toString(),
    });
  } catch (error) {
    console.error("Library book GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 },
    );
  }
}
