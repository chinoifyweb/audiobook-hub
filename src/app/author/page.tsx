import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  BookOpen,
  Star,
  Upload,
  BarChart3,
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AuthorOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const authorProfile = await prisma.authorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      books: {
        where: { status: "published" },
        select: { id: true, ratingAverage: true, ratingCount: true },
      },
    },
  });

  if (!authorProfile) redirect("/dashboard");

  // Calculate this month's earnings
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyEarnings = await prisma.purchase.aggregate({
    where: {
      book: { authorId: authorProfile.id },
      status: "successful",
      purchasedAt: { gte: startOfMonth },
    },
    _sum: { authorEarnings: true },
  });

  // Total published books
  const publishedBooksCount = authorProfile.books.length;

  // Average rating across all books
  const booksWithRatings = authorProfile.books.filter(
    (b) => b.ratingCount > 0
  );
  const avgRating =
    booksWithRatings.length > 0
      ? booksWithRatings.reduce(
          (sum, b) => sum + Number(b.ratingAverage),
          0
        ) / booksWithRatings.length
      : 0;

  // Recent sales (last 10)
  const recentSales = await prisma.purchase.findMany({
    where: {
      book: { authorId: authorProfile.id },
      status: "successful",
    },
    include: {
      book: { select: { title: true, coverImageUrl: true } },
      user: { select: { fullName: true, email: true } },
    },
    orderBy: { purchasedAt: "desc" },
    take: 10,
  });

  const totalEarningsKobo = Number(authorProfile.totalEarnings) * 100;
  const pendingPayoutKobo = Number(authorProfile.pendingPayout) * 100;
  const thisMonthKobo = monthlyEarnings._sum.authorEarnings || 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Author Overview</h1>
          <p className="text-muted-foreground">
            Track your sales, earnings, and book performance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/author/books/new">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Book
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/author/analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(totalEarningsKobo)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(thisMonthKobo)}
            </div>
            <p className="text-xs text-muted-foreground">
              {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(pendingPayoutKobo)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting settlement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedBooksCount}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {avgRating > 0
                ? `${avgRating.toFixed(1)} avg rating`
                : "No ratings yet"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No sales yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sales will appear here once customers purchase your books.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-8 shrink-0 rounded bg-muted" />
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {sale.book.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {sale.user.fullName || sale.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {formatPrice(sale.authorEarnings)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sale.purchasedAt
                        ? new Date(sale.purchasedAt).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
