import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (
      status &&
      ["draft", "pending_review", "published", "rejected", "archived"].includes(
        status
      )
    ) {
      where.status = status;
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          author: {
            include: {
              user: {
                select: { fullName: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    return NextResponse.json({
      books,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin books GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookId, action, rejectionReason, isFeatured } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};

    if (action === "approve") {
      data.status = "published";
      data.rejectionReason = null;
    } else if (action === "reject") {
      data.status = "rejected";
      data.rejectionReason = rejectionReason || "No reason provided";
    } else if (isFeatured !== undefined) {
      data.isFeatured = Boolean(isFeatured);
    }

    const book = await prisma.book.update({
      where: { id: bookId },
      data,
      include: {
        author: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Admin books PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
