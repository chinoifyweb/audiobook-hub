import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = { isActive: true };

    // If not logged in, only show public books
    if (!session?.user) {
      where.isPublic = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const orderBy: Record<string, string> = {};
    if (sortBy === "title") orderBy.title = sortOrder;
    else if (sortBy === "downloads") orderBy.downloadCount = sortOrder;
    else orderBy.createdAt = sortOrder;

    const books = await prisma.libraryBook.findMany({
      where: where as any,
      orderBy,
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        category: true,
        subcategory: true,
        coverImageUrl: true,
        fileType: true,
        fileSize: true,
        publisher: true,
        publicationYear: true,
        language: true,
        tags: true,
        downloadCount: true,
        isPublic: true,
        createdAt: true,
      },
    });

    const serialized = books.map((b) => ({
      ...b,
      fileSize: b.fileSize.toString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Library GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 },
    );
  }
}
