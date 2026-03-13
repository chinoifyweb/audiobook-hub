import { Card, CardContent, CardHeader, CardTitle, Button } from "@repo/ui";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { formatPrice } from "@/lib/utils";


import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Download,
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const authorProfile = await prisma.authorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!authorProfile) redirect("/dashboard");

  // Aggregate stats
  const totals = await prisma.purchase.aggregate({
    where: {
      book: { authorId: authorProfile.id },
      status: "successful",
    },
    _sum: {
      amountPaid: true,
      authorEarnings: true,
      platformFee: true,
    },
    _count: true,
  });

  const totalRevenue = totals._sum.amountPaid || 0;
  const totalSalesCount = totals._count;
  const avgSaleAmount =
    totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  // Sales by book
  const books = await prisma.book.findMany({
    where: { authorId: authorProfile.id },
    select: {
      id: true,
      title: true,
      price: true,
      purchases: {
        where: { status: "successful" },
        select: {
          amountPaid: true,
          authorEarnings: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const salesByBook = books.map((book) => {
    const unitsSold = book.purchases.length;
    const totalBookRevenue = book.purchases.reduce(
      (sum, p) => sum + p.amountPaid,
      0
    );
    const totalBookEarnings = book.purchases.reduce(
      (sum, p) => sum + p.authorEarnings,
      0
    );
    return {
      id: book.id,
      title: book.title,
      price: book.price,
      unitsSold,
      totalRevenue: totalBookRevenue,
      authorEarnings: totalBookEarnings,
    };
  });

  // Sort by revenue descending
  salesByBook.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Monthly summary (last 6 months)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const recentPurchases = await prisma.purchase.findMany({
    where: {
      book: { authorId: authorProfile.id },
      status: "successful",
      purchasedAt: { gte: sixMonthsAgo },
    },
    select: {
      amountPaid: true,
      authorEarnings: true,
      purchasedAt: true,
    },
    orderBy: { purchasedAt: "asc" },
  });

  // Group by month
  const monthlyData: Record<string, { revenue: number; earnings: number; count: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = { revenue: 0, earnings: 0, count: 0 };
  }

  recentPurchases.forEach((p) => {
    if (p.purchasedAt) {
      const key = `${p.purchasedAt.getFullYear()}-${String(
        p.purchasedAt.getMonth() + 1
      ).padStart(2, "0")}`;
      if (monthlyData[key]) {
        monthlyData[key].revenue += p.amountPaid;
        monthlyData[key].earnings += p.authorEarnings;
        monthlyData[key].count += 1;
      }
    }
  });

  const monthLabels = Object.keys(monthlyData).map((key) => {
    const [year, month] = key.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Sales & Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your sales performance and revenue.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/author/analytics/export" target="_blank">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross sales across all books
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">
              Units sold lifetime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Sale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(avgSaleAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average amount per sale
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Month</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Sales</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Revenue</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Your Earnings</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(monthlyData).map(([key, data], i) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-3 font-medium">{monthLabels[i]}</td>
                    <td className="py-3 text-right">{data.count}</td>
                    <td className="py-3 text-right">{formatPrice(data.revenue)}</td>
                    <td className="py-3 text-right text-green-600">
                      {formatPrice(data.earnings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sales by book */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Book</CardTitle>
        </CardHeader>
        <CardContent>
          {salesByBook.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No sales data yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Book</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Units Sold
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Total Revenue
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Your Earnings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salesByBook.map((book) => (
                    <tr key={book.id} className="border-b last:border-0">
                      <td className="max-w-[200px] truncate py-3 font-medium">
                        {book.title}
                      </td>
                      <td className="py-3 text-right">
                        {book.price === 0 ? "Free" : formatPrice(book.price)}
                      </td>
                      <td className="py-3 text-right">{book.unitsSold}</td>
                      <td className="py-3 text-right">
                        {formatPrice(book.totalRevenue)}
                      </td>
                      <td className="py-3 text-right text-green-600">
                        {formatPrice(book.authorEarnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
