import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "author") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const authorProfile = await prisma.authorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!authorProfile) {
      return NextResponse.json(
        { error: "Author profile not found" },
        { status: 404 }
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

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!genre || typeof genre !== "string") {
      return NextResponse.json(
        { error: "Genre is required" },
        { status: 400 }
      );
    }

    // Validate book type
    const validBookTypes = ["ebook", "audiobook", "both"];
    if (!validBookTypes.includes(bookType)) {
      return NextResponse.json(
        { error: "Invalid book type" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["draft", "pending_review"];
    const bookStatus = validStatuses.includes(status) ? status : "draft";

    // Validate price
    const bookPrice = isFree ? 0 : (typeof price === "number" ? price : 0);
    if (!isFree && bookPrice < 50000) {
      // 50000 kobo = ₦500 minimum
      return NextResponse.json(
        { error: "Minimum price is \u20A6500" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(title.trim());
    const existingSlug = await prisma.book.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const book = await prisma.book.create({
      data: {
        authorId: authorProfile.id,
        title: title.trim(),
        slug,
        description: description || null,
        shortDescription: shortDescription || null,
        genre,
        subGenre: subGenre || null,
        language: language || "English",
        isbn: isbn || null,
        bookType,
        price: bookPrice,
        isFree: !!isFree,
        status: bookStatus,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
