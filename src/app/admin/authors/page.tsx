import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthorsClient } from "./authors-client";

interface Props {
  searchParams: { search?: string; status?: string; page?: string };
}

export default async function AdminAuthorsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  const search = searchParams.search || "";
  const status = searchParams.status || "";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 20;
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

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Author Management</h1>
        <p className="text-muted-foreground">
          Approve authors, manage commissions, and review earnings.
        </p>
      </div>

      <AuthorsClient
        authors={authors.map((a) => ({
          id: a.id,
          penName: a.penName,
          email: a.user.email,
          fullName: a.user.fullName,
          isApproved: a.isApproved,
          isActive: a.user.isActive,
          commissionRate: Number(a.commissionRate),
          totalEarnings: Number(a.totalEarnings),
          pendingPayout: Number(a.pendingPayout),
          bookCount: a._count.books,
          createdAt: a.createdAt.toISOString(),
        }))}
        total={total}
        page={page}
        totalPages={totalPages}
        currentSearch={search}
        currentStatus={status}
      />
    </div>
  );
}
