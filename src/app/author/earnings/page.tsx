import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
import {
  Wallet,
  DollarSign,
  Building2,
  Clock,
  Info,
} from "lucide-react";

const payoutStatusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "outline" },
  processing: { label: "Processing", variant: "secondary" },
  paid: { label: "Paid", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const authorProfile = await prisma.authorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      totalEarnings: true,
      pendingPayout: true,
      commissionRate: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
    },
  });

  if (!authorProfile) redirect("/dashboard");

  // Total gross sales
  const grossSales = await prisma.purchase.aggregate({
    where: {
      book: { authorId: authorProfile.id },
      status: "successful",
    },
    _sum: {
      amountPaid: true,
      authorEarnings: true,
      platformFee: true,
    },
  });

  // Payout history
  const payouts = await prisma.authorPayout.findMany({
    where: { authorId: authorProfile.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const pendingPayoutKobo = Number(authorProfile.pendingPayout) * 100;
  const grossSalesKobo = grossSales._sum.amountPaid || 0;
  const totalAuthorEarningsKobo = grossSales._sum.authorEarnings || 0;
  const platformFeeKobo = grossSales._sum.platformFee || 0;
  const commRate = Number(authorProfile.commissionRate);

  // Mask bank account number
  const maskedAccount = authorProfile.bankAccountNumber
    ? "****" + authorProfile.bankAccountNumber.slice(-4)
    : "Not set";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Earnings & Payouts
        </h1>
        <p className="text-muted-foreground">
          View your earnings breakdown and payout history.
        </p>
      </div>

      {/* Balance card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-2 py-8">
          <Wallet className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-4xl font-bold text-primary">
            {formatPrice(pendingPayoutKobo)}
          </p>
          <p className="text-xs text-muted-foreground">
            Awaiting settlement via Paystack
          </p>
        </CardContent>
      </Card>

      {/* Earnings breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(grossSalesKobo)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total sales before commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Earnings ({(commRate * 100).toFixed(0)}%)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(totalAuthorEarningsKobo)}
            </div>
            <p className="text-xs text-muted-foreground">
              Your share after commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Fee ({((1 - commRate) * 100).toFixed(0)}%)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {formatPrice(platformFeeKobo)}
            </div>
            <p className="text-xs text-muted-foreground">
              Deducted as platform commission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bank details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank Account
          </CardTitle>
          <CardDescription>
            Payouts are settled to this account via Paystack.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Bank Name</p>
              <p className="text-sm font-medium">
                {authorProfile.bankName || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Number</p>
              <p className="text-sm font-medium">{maskedAccount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Name</p>
              <p className="text-sm font-medium">
                {authorProfile.bankAccountName || "Not set"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlement info */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Paystack Settlement Schedule</p>
          <p className="mt-1">
            Paystack settles funds to your bank account automatically, typically
            within T+1 (next business day) for Nigerian bank accounts. Split
            payments are settled directly to your subaccount.
          </p>
        </div>
      </div>

      {/* Payout history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No payouts recorded yet. Payouts appear here once settlements are
              processed.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Period
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => {
                    const config = payoutStatusConfig[payout.status] || {
                      label: payout.status,
                      variant: "secondary" as const,
                    };
                    return (
                      <tr key={payout.id} className="border-b last:border-0">
                        <td className="py-3">
                          {new Date(payout.createdAt).toLocaleDateString(
                            "en-NG",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(payout.periodStart).toLocaleDateString(
                            "en-NG",
                            { month: "short", day: "numeric" }
                          )}{" "}
                          -{" "}
                          {new Date(payout.periodEnd).toLocaleDateString(
                            "en-NG",
                            { month: "short", day: "numeric" }
                          )}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatPrice(payout.amount)}
                        </td>
                        <td className="py-3 text-right">
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </td>
                        <td className="py-3 text-right text-xs text-muted-foreground">
                          {payout.paystackTransferReference || "---"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
