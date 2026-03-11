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
      where.OR = [
        { penName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status === "approved") {
      where.isApproved = true;
    } else if (status === "pending") {
      where.isApproved = false;
    }

    const [authors, total] = await Promise.all([
      prisma.authorProfile.findMany({
        where,
        include: {
          user: {
            select: { fullName: true, email: true, isActive: true },
          },
          _count: {
            select: { books: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.authorProfile.count({ where }),
    ]);

    return NextResponse.json({
      authors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin authors GET error:", error);
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
    const { authorId, action, commissionRate } = body;

    if (!authorId) {
      return NextResponse.json(
        { error: "authorId is required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};

    if (action === "approve") {
      data.isApproved = true;
      // Also update the user role to author
      const author = await prisma.authorProfile.findUnique({
        where: { id: authorId },
        select: { userId: true },
      });
      if (author) {
        await prisma.user.update({
          where: { id: author.userId },
          data: { role: "author" },
        });
      }
    } else if (action === "reject") {
      data.isApproved = false;
    }

    if (commissionRate !== undefined) {
      const rate = parseFloat(commissionRate);
      if (rate >= 0 && rate <= 1) {
        data.commissionRate = rate;
      }
    }

    const author = await prisma.authorProfile.update({
      where: { id: authorId },
      data,
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        _count: {
          select: { books: true },
        },
      },
    });

    return NextResponse.json({ author });
  } catch (error) {
    console.error("Admin authors PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
