import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const fileType = searchParams.get("fileType") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (fileType) {
      where.fileType = fileType;
    }

    const orderBy: Record<string, string> = {};
    if (sortBy === "title") orderBy.title = sortOrder;
    else if (sortBy === "downloads") orderBy.downloadCount = sortOrder;
    else orderBy.createdAt = sortOrder;

    const books = await prisma.libraryBook.findMany({
      where: where as any,
      orderBy,
      include: {
        uploader: {
          select: { fullName: true, email: true },
        },
      },
    });

    // Convert BigInt to string for JSON serialization
    const serialized = books.map((b) => ({
      ...b,
      fileSize: b.fileSize.toString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 },
      );
    }
    console.error("Library GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch library books" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const {
      title,
      author,
      description,
      category,
      subcategory,
      coverImageUrl,
      fileUrl,
      fileType,
      fileSize,
      isbn,
      publisher,
      publicationYear,
      language,
      tags,
      isPublic,
    } = body;

    if (!title || !author || !category || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: "Missing required fields: title, author, category, fileUrl, fileType" },
        { status: 400 },
      );
    }

    const book = await prisma.libraryBook.create({
      data: {
        title,
        author,
        description: description || null,
        category,
        subcategory: subcategory || null,
        coverImageUrl: coverImageUrl || null,
        fileUrl,
        fileType,
        fileSize: BigInt(fileSize || 0),
        isbn: isbn || null,
        publisher: publisher || null,
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : null,
        language: language || "English",
        tags: tags || [],
        isPublic: isPublic !== false,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json(
      { ...book, fileSize: book.fileSize.toString() },
      { status: 201 },
    );
  } catch (error) {
    console.error("Library POST error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create library book" },
      { status: 500 },
    );
  }
}
