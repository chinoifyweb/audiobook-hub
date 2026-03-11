import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  BookOpen,
  DollarSign,
  CreditCard,
  Clock,
  UserCheck,
} from "lucide-react";

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const [
    totalUsers,
    customerCount,
    authorCount,
    totalBooks,
    publishedBooks,
    pendingBooks,
    draftBooks,
    revenueResult,
    activeSubscriptions,
    pendingReviews,
    pendingAuthors,
    recentUsers,
    recentPurchases,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "author" } }),
    prisma.book.count(),
    prisma.book.count({ where: { status: "published" } }),
    prisma.book.count({ where: { status: "pending_review" } }),
    prisma.book.count({ where: { status: "draft" } }),
    prisma.purchase.aggregate({
      where: { status: "successful" },
      _sum: { platformFee: true },
    }),
    prisma.customerSubscription.count({ where: { status: "active" } }),
    prisma.book.count({ where: { status: "pending_review" } }),
    prisma.authorProfile.count({ where: { isApproved: false } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.purchase.findMany({
      where: { status: "successful" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amountPaid: true,
        platformFee: true,
        createdAt: true,
        user: { select: { fullName: true, email: true } },
        book: { select: { title: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    customerCount,
    authorCount,
    totalBooks,
    publishedBooks,
    pendingBooks,
    draftBooks,
    totalRevenue: revenueResult._sum.platformFee ?? 0,
    activeSubscriptions,
    pendingReviews,
    pendingAuthors,
    recentUsers,
    recentPurchases,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      subtitle: `${stats.customerCount} customers, ${stats.authorCount} authors`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Books",
      value: stats.totalBooks.toLocaleString(),
      subtitle: `${stats.publishedBooks} published, ${stats.draftBooks} drafts`,
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Platform Revenue",
      value: formatPrice(stats.totalRevenue as number),
      subtitle: "From platform commissions",
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Active Subscribers",
      value: stats.activeSubscriptions.toLocaleString(),
      subtitle: "Current active plans",
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingReviews.toLocaleString(),
      subtitle: "Books awaiting approval",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Pending Authors",
      value: stats.pendingAuthors.toLocaleString(),
      subtitle: "Author applications to review",
      icon: UserCheck,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h2>
        <p className="text-sm text-gray-500">
          Overview of your audiobook marketplace
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="mt-1 text-xs text-gray-500">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent signups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Signups</CardTitle>
            <CardDescription>Latest users who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUsers.length === 0 && (
                <p className="text-sm text-gray-500">No users yet.</p>
              )}
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-100 text-xs">
                      {(user.fullName ?? user.email)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {user.fullName ?? "Unnamed"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <RoleBadge role={user.role} />
                    <span className="text-xs text-gray-400">
                      {formatRelativeDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <CardDescription>Latest successful purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentPurchases.length === 0 && (
                <p className="text-sm text-gray-500">No transactions yet.</p>
              )}
              {stats.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {purchase.book.title}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {purchase.user.fullName ?? purchase.user.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(purchase.amountPaid)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeDate(purchase.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    customer: {
      label: "Customer",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    author: {
      label: "Author",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    admin: {
      label: "Admin",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    },
  };

  const v = variants[role] ?? variants.customer;
  return (
    <Badge variant="outline" className={`text-[10px] ${v.className}`}>
      {v.label}
    </Badge>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
}
