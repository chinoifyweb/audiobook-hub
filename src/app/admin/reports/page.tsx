import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
} from "lucide-react";

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  // Fetch aggregate data
  const [
    totalPurchases,
    activeSubs,
    topBooks,
    topAuthors,
    monthlyRevenue,
  ] = await Promise.all([
    // Total revenue from successful purchases
    prisma.purchase.aggregate({
      where: { status: "successful" },
      _sum: { amountPaid: true, platformFee: true, authorEarnings: true },
      _count: { _all: true },
    }),

    // Active subscriptions with plan details
    prisma.customerSubscription.count({
      where: { status: "active" },
    }),

    // Top 10 selling books
    prisma.book.findMany({
      where: { status: "published" },
      include: {
        author: {
          include: { user: { select: { fullName: true } } },
        },
        _count: {
          select: { purchases: { where: { status: "successful" } } },
        },
      },
      orderBy: { purchases: { _count: "desc" } },
      take: 10,
    }),

    // Top 10 earning authors
    prisma.authorProfile.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { fullName: true, email: true } },
        _count: { select: { books: true } },
      },
      orderBy: { totalEarnings: "desc" },
      take: 10,
    }),

    // Monthly revenue for last 6 months (raw SQL for grouping)
    prisma.$queryRaw<
      Array<{ month: string; total: bigint; count: bigint }>
    >`
      SELECT
        TO_CHAR(purchased_at, 'YYYY-MM') as month,
        SUM(amount_paid) as total,
        COUNT(*) as count
      FROM purchases
      WHERE status = 'successful'
        AND purchased_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(purchased_at, 'YYYY-MM')
      ORDER BY month DESC
    `,
  ]);

  const totalRevenue = totalPurchases._sum.amountPaid || 0;
  const totalPlatformFee = totalPurchases._sum.platformFee || 0;
  const totalAuthorPayouts = totalPurchases._sum.authorEarnings || 0;
  const purchaseCount = totalPurchases._count._all;

  // Subscription revenue estimate (sum of active * plan price)
  const subPlansWithCounts = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { subscriptions: { where: { status: "active" } } } },
    },
  });
  const monthlySubRevenue = subPlansWithCounts.reduce(
    (sum, p) => sum + p.price * p._count.subscriptions,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Platform revenue, top sellers, and financial analytics.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {purchaseCount} purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalPlatformFee)}</div>
            <p className="text-xs text-muted-foreground">
              Platform&apos;s share of sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Author Payouts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalAuthorPayouts)}</div>
            <p className="text-xs text-muted-foreground">
              Total paid to authors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscription Revenue</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(monthlySubRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {activeSubs} active subscribers (monthly est.)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly revenue table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Monthly Revenue (Last 6 Months)</h2>
          <Badge variant="outline">Export (coming soon)</Badge>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Month</th>
                <th className="px-4 py-3 text-left font-medium">Total Revenue</th>
                <th className="px-4 py-3 text-left font-medium">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRevenue.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No revenue data yet.
                  </td>
                </tr>
              ) : (
                monthlyRevenue.map((row, i) => (
                  <tr
                    key={row.month}
                    className={`border-b transition-colors hover:bg-muted/30 ${
                      i % 2 === 0 ? "bg-background" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{row.month}</td>
                    <td className="px-4 py-3">{formatPrice(Number(row.total))}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {Number(row.count)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top selling books */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Top Selling Books</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Author</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Units Sold</th>
              </tr>
            </thead>
            <tbody>
              {topBooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No sales data yet.
                  </td>
                </tr>
              ) : (
                topBooks.map((book, i) => (
                  <tr
                    key={book.id}
                    className={`border-b transition-colors hover:bg-muted/30 ${
                      i % 2 === 0 ? "bg-background" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{book.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {book.author.user.fullName || "—"}
                    </td>
                    <td className="px-4 py-3">{formatPrice(book.price)}</td>
                    <td className="px-4 py-3 font-medium">
                      {book._count.purchases}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top earning authors */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Top Earning Authors</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Author</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Books</th>
                <th className="px-4 py-3 text-left font-medium">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {topAuthors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No author data yet.
                  </td>
                </tr>
              ) : (
                topAuthors.map((author, i) => (
                  <tr
                    key={author.id}
                    className={`border-b transition-colors hover:bg-muted/30 ${
                      i % 2 === 0 ? "bg-background" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {author.penName || author.user.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {author.user.email}
                    </td>
                    <td className="px-4 py-3">{author._count.books}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(Number(author.totalEarnings) * 100)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
