import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const book = await prisma.libraryBook.findUnique({
      where: { id: params.id },
      include: {
        uploader: { select: { fullName: true, email: true } },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...book,
      fileSize: book.fileSize.toString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const body = await request.json();

    const existing = await prisma.libraryBook.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "title",
      "author",
      "description",
      "category",
      "subcategory",
      "coverImageUrl",
      "fileUrl",
      "fileType",
      "isbn",
      "publisher",
      "language",
      "tags",
      "isPublic",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.fileSize !== undefined) {
      updateData.fileSize = BigInt(body.fileSize);
    }
    if (body.publicationYear !== undefined) {
      updateData.publicationYear = body.publicationYear
        ? parseInt(body.publicationYear, 10)
        : null;
    }

    const book = await prisma.libraryBook.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      ...book,
      fileSize: book.fileSize.toString(),
    });
  } catch (error) {
    console.error("Library PATCH error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const existing = await prisma.libraryBook.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.libraryBook.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 },
    );
  }
}
