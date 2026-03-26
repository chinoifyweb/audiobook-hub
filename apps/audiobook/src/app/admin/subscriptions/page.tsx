import { Badge } from "@repo/ui";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { formatPrice } from "@/lib/utils";

import { SubscriptionsClient } from "./subscriptions-client";

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  const [plans, subscriptions] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { subscriptions: { where: { status: "active" } } },
        },
      },
      orderBy: { price: "asc" },
    }),
    prisma.customerSubscription.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        plan: { select: { name: true, price: true, interval: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage subscription plans and view active subscribers.
        </p>
      </div>

      {/* Subscription Plans */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Subscription Plans</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Plan Name</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Interval</th>
                <th className="px-4 py-3 text-left font-medium">Books/Month</th>
                <th className="px-4 py-3 text-left font-medium">Active Subscribers</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No subscription plans found.
                  </td>
                </tr>
              ) : (
                plans.map((plan, i) => (
                  <tr
                    key={plan.id}
                    className={`border-b transition-colors hover:bg-muted/30 ${
                      i % 2 === 0 ? "bg-background" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{plan.name}</td>
                    <td className="px-4 py-3">{formatPrice(plan.price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{plan.interval}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {plan.maxBooksPerMonth ? plan.maxBooksPerMonth : "Unlimited"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {plan._count.subscriptions}
                    </td>
                    <td className="px-4 py-3">
                      {plan.isActive ? (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <SubscriptionsClient
                        planId={plan.id}
                        isActive={plan.isActive}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Active Subscribers */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Subscribers</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Started</th>
                <th className="px-4 py-3 text-left font-medium">Next Payment</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No subscribers found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub, i) => {
                  const statusColors: Record<string, string> = {
                    active: "bg-green-600",
                    attention: "bg-yellow-500",
                    cancelled: "bg-red-500",
                    completed: "bg-gray-500",
                    non_renewing: "bg-orange-500",
                  };

                  return (
                    <tr
                      key={sub.id}
                      className={`border-b transition-colors hover:bg-muted/30 ${
                        i % 2 === 0 ? "bg-background" : "bg-muted/10"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {sub.user.fullName || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sub.user.email}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">{sub.plan.name}</span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({formatPrice(sub.plan.price)}/{sub.plan.interval})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="default"
                          className={statusColors[sub.status] || "bg-gray-500"}
                        >
                          {sub.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sub.currentPeriodStart
                          ? new Date(sub.currentPeriodStart).toLocaleDateString()
                          : new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sub.nextPaymentDate
                          ? new Date(sub.nextPaymentDate).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
