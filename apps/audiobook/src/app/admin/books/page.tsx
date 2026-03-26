import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { BooksClient } from "./books-client";

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { search?: string; status?: string; page?: string };
}

export default async function AdminBooksPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  const search = searchParams.search || "";
  const status = searchParams.status || "";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }
  if (
    status &&
    ["draft", "pending_review", "published", "rejected", "archived"].includes(status)
  ) {
    where.status = status;
  }

  const [books, total, statusCounts] = await Promise.all([
    prisma.book.findMany({
      where,
      include: {
        author: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.book.count({ where }),
    prisma.book.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const counts: Record<string, number> = {};
  let allCount = 0;
  for (const sc of statusCounts) {
    counts[sc.status] = sc._count._all;
    allCount += sc._count._all;
  }
  counts["all"] = allCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Book Management</h1>
        <p className="text-muted-foreground">
          Review, approve, and manage all books on the platform.
        </p>
      </div>

      <BooksClient
        books={books.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          genre: b.genre,
          price: b.price,
          status: b.status,
          isFeatured: b.isFeatured,
          bookType: b.bookType,
          coverImageUrl: b.coverImageUrl,
          createdAt: b.createdAt.toISOString(),
          authorName: b.author.penName || b.author.user.fullName || b.author.user.email,
          rejectionReason: b.rejectionReason,
        }))}
        total={total}
        page={page}
        totalPages={totalPages}
        currentSearch={search}
        currentStatus={status}
        statusCounts={counts}
      />
    </div>
  );
}
