import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const book = await prisma.libraryBook.findUnique({
      where: { id: params.id, isActive: true },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Increment download count
    await prisma.libraryBook.update({
      where: { id: params.id },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({ fileUrl: book.fileUrl });
  } catch (error) {
    console.error("Library download error:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 },
    );
  }
}
