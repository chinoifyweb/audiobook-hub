import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Badge, Separator, Progress } from "@repo/ui";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { formatPrice } from "@/lib/utils";





import {
  CheckCircle,
  CreditCard,
  Calendar,
  BookOpen,
  AlertTriangle,
  ArrowUpRight,
  Crown,
} from "lucide-react";
import { CancelSubscriptionButton } from "./cancel-button";

export const dynamic = 'force-dynamic';

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  attention: "destructive",
  cancelled: "secondary",
  completed: "secondary",
  non_renewing: "outline",
};

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch user's subscription with plan details
  const subscription = await prisma.customerSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  // Count books accessed this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const booksAccessedThisMonth = await prisma.userLibrary.count({
    where: {
      userId,
      accessType: "subscription",
      addedAt: { gte: monthStart },
    },
  });

  // Fetch all active plans for upgrade/downgrade
  const allPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  // Fetch recent subscription-related payments for billing history
  const billingHistory = await prisma.purchase.findMany({
    where: {
      userId,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      book: {
        select: { title: true },
      },
    },
  });

  if (!subscription) {
    return <NoSubscriptionView plans={allPlans} />;
  }

  const maxBooks = subscription.plan.maxBooksPerMonth;
  const usagePercentage = maxBooks
    ? Math.min(Math.round((booksAccessedThisMonth / maxBooks) * 100), 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription plan and billing
        </p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>{subscription.plan.name}</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {subscription.plan.description}
              </CardDescription>
            </div>
            <Badge variant={statusVariant[subscription.status] || "secondary"}>
              {subscription.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Plan Price</p>
                <p className="text-2xl font-bold">
                  {formatPrice(subscription.plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{subscription.plan.interval}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Next Billing Date</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.nextPaymentDate
                    ? new Date(subscription.nextPaymentDate).toLocaleDateString(
                        "en-NG",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Books This Month</p>
                <p className="text-sm text-muted-foreground">
                  {booksAccessedThisMonth}{" "}
                  {maxBooks ? `/ ${maxBooks}` : "(Unlimited)"}
                </p>
              </div>
            </div>
          </div>

          {/* Usage progress bar */}
          {maxBooks && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly usage</span>
                <span className="font-medium">{usagePercentage}%</span>
              </div>
              <Progress value={usagePercentage} />
              {usagePercentage >= 80 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    You&apos;re approaching your monthly limit. Consider
                    upgrading for more access.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Subscription period */}
          {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-medium mb-1">Current Billing Period</p>
              <p className="text-muted-foreground">
                {new Date(subscription.currentPeriodStart).toLocaleDateString(
                  "en-NG",
                  { month: "short", day: "numeric", year: "numeric" }
                )}{" "}
                &mdash;{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                  "en-NG",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            </div>
          )}

          {subscription.status === "non_renewing" && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Subscription ending</p>
                <p>
                  Your subscription will not renew. You will have access until{" "}
                  {subscription.currentPeriodEnd
                    ? new Date(
                        subscription.currentPeriodEnd
                      ).toLocaleDateString("en-NG", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "the end of your current period"}
                  .
                </p>
              </div>
            </div>
          )}

          {subscription.cancelledAt && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Subscription cancelled</p>
                <p>
                  Cancelled on{" "}
                  {new Date(subscription.cancelledAt).toLocaleDateString(
                    "en-NG",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                  .
                </p>
              </div>
            </div>
          )}
        </CardContent>
        {subscription.status === "active" && (
          <CardFooter className="flex gap-3">
            <CancelSubscriptionButton
              subscriptionId={subscription.id}
              periodEnd={
                subscription.currentPeriodEnd?.toISOString() || undefined
              }
            />
          </CardFooter>
        )}
      </Card>

      {/* Plan Comparison / Upgrade */}
      {allPlans.length > 1 && subscription.status === "active" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Change Plan</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allPlans.map((plan) => {
              const isCurrent = plan.id === subscription.planId;
              const rawFeatures = plan.features;
              const features: string[] = Array.isArray(rawFeatures)
                ? rawFeatures
                : typeof rawFeatures === "string"
                  ? JSON.parse(rawFeatures)
                  : [];

              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {isCurrent && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{plan.interval}
                      </span>
                    </div>
                    {plan.maxBooksPerMonth ? (
                      <p className="text-sm text-muted-foreground">
                        {plan.maxBooksPerMonth} books/month
                      </p>
                    ) : (
                      <p className="text-sm text-primary font-medium">
                        Unlimited books
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {features.slice(0, 4).map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isCurrent ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" asChild>
                        <Link href="/pricing">
                          {plan.price > subscription.plan.price
                            ? "Upgrade"
                            : "Switch"}
                          <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Billing History */}
      <div>
        <h2 className="text-xl font-bold mb-4">Billing History</h2>
        {billingHistory.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {billingHistory.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {purchase.book.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(purchase.createdAt).toLocaleDateString(
                          "en-NG",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {formatPrice(purchase.amountPaid)}
                      </span>
                      <Badge
                        variant={
                          purchase.status === "successful"
                            ? "default"
                            : purchase.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {purchase.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No billing history yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function NoSubscriptionView({
  plans,
}: {
  plans: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    interval: string;
    maxBooksPerMonth: number | null;
    features: unknown;
  }[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Subscription</h1>
        <p className="text-muted-foreground mt-1">
          You don&apos;t have an active subscription yet
        </p>
      </div>

      <Card className="text-center">
        <CardContent className="py-12">
          <Crown className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">No Active Subscription</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Subscribe to get unlimited access to thousands of audiobooks and
            ebooks. Choose a plan that works for you.
          </p>
          <Button size="lg" asChild>
            <Link href="/pricing">
              Choose a Plan
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {plans.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Available Plans</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans
              .filter((p) => p.interval === "monthly")
              .map((plan) => {
                const rawFeatures = plan.features;
                const features: string[] = Array.isArray(rawFeatures)
                  ? rawFeatures
                  : typeof rawFeatures === "string"
                    ? JSON.parse(rawFeatures)
                    : [];

                return (
                  <Card key={plan.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /month
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <Separator className="mb-4" />
                      <ul className="space-y-2">
                        {features.slice(0, 5).map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" asChild>
                        <Link href="/pricing">Subscribe Now</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
