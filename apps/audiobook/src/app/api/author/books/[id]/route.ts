import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { generateSlug } from "@/lib/utils";

async function getAuthorAndBook(userId: string, bookId: string) {
  const authorProfile = await prisma.authorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!authorProfile) return { authorProfile: null, book: null };

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, authorId: true, status: true, slug: true },
  });

  if (!book || book.authorId !== authorProfile.id) {
    return { authorProfile, book: null };
  }

  return { authorProfile, book };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "author") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { authorProfile, book } = await getAuthorAndBook(session.user.id, id);

    if (!authorProfile) {
      return NextResponse.json({ error: "Author profile not found" }, { status: 404 });
    }
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Only draft and rejected books can be edited
    if (book.status !== "draft" && book.status !== "rejected") {
      return NextResponse.json(
        { error: "Only draft or rejected books can be edited" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      shortDescription,
      genre,
      subGenre,
      language,
      isbn,
      bookType,
      price,
      isFree,
      status,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      updateData.title = title.trim();
      // Update slug if title changed
      let newSlug = generateSlug(title.trim());
      const existingSlug = await prisma.book.findFirst({
        where: { slug: newSlug, id: { not: id } },
        select: { id: true },
      });
      if (existingSlug) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
      updateData.slug = newSlug;
    }

    if (description !== undefined) updateData.description = description || null;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription || null;
    if (genre !== undefined) updateData.genre = genre;
    if (subGenre !== undefined) updateData.subGenre = subGenre || null;
    if (language !== undefined) updateData.language = language;
    if (isbn !== undefined) updateData.isbn = isbn || null;
    if (bookType !== undefined) {
      const validTypes = ["ebook", "audiobook", "both"];
      if (validTypes.includes(bookType)) updateData.bookType = bookType;
    }
    if (isFree !== undefined) updateData.isFree = !!isFree;
    if (price !== undefined) {
      updateData.price = isFree ? 0 : price;
    }

    // Handle status change (only draft -> pending_review is allowed by author)
    if (status === "pending_review") {
      updateData.status = "pending_review";
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "author") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { authorProfile, book } = await getAuthorAndBook(session.user.id, id);

    if (!authorProfile) {
      return NextResponse.json({ error: "Author profile not found" }, { status: 404 });
    }
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Soft delete by archiving
    await prisma.book.update({
      where: { id },
      data: { status: "archived" },
    });

    return NextResponse.json({ message: "Book archived successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
