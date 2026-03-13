"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from "@repo/ui";
import { CreditCard, Loader2, Receipt, CheckCircle } from "lucide-react";

interface TuitionFee {
  id: string;
  amount: number;
  description: string | null;
  dueDate: string;
  program: { name: string };
  semester: {
    name: string;
    session: { name: string };
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    paystackReference: string | null;
    receiptUrl: string | null;
  } | null;
}

function statusBadge(status: string) {
  switch (status) {
    case "successful":
      return <Badge className="bg-green-600">Paid</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function PaymentsPage() {
  const [fees, setFees] = useState<TuitionFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    fetchFees();
  }, []);

  async function fetchFees() {
    try {
      const res = await fetch("/api/payments/initialize");
      const data = await res.json();
      setFees(data.fees || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(feeId: string) {
    setPaying(feeId);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tuitionFeeId: feeId }),
      });

      const data = await res.json();

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      // ignore
    } finally {
      setPaying(null);
    }
  }

  // Check for callback verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (reference) {
      fetch(`/api/payments/verify?reference=${reference}`)
        .then((r) => r.json())
        .then(() => {
          // Remove query params and refresh
          window.history.replaceState({}, "", "/payments");
          fetchFees();
        });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const outstanding = fees.filter(
    (f) => !f.payment || f.payment.status !== "successful"
  );
  const paid = fees.filter(
    (f) => f.payment && f.payment.status === "successful"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Manage your tuition payments</p>
      </div>

      {/* Outstanding Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Outstanding Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outstanding.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-3" />
              <p className="text-muted-foreground">
                No outstanding payments. You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {outstanding.map((fee) => (
                <div
                  key={fee.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-medium">
                      {fee.description || "Tuition Fee"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {fee.semester.session.name} - {fee.semester.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(fee.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">
                      {"\u20A6"}{(fee.amount / 100).toLocaleString()}
                    </span>
                    <Button
                      onClick={() => handlePay(fee.id)}
                      disabled={paying === fee.id}
                      size="sm"
                    >
                      {paying === fee.id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paid.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No payment history yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Semester</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-center">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paid.map((fee) => (
                    <tr key={fee.id} className="border-b last:border-0">
                      <td className="py-3">
                        {fee.description || "Tuition Fee"}
                      </td>
                      <td className="py-3">
                        {fee.semester.session.name} - {fee.semester.name}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {"\u20A6"}{(fee.payment!.amount / 100).toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        {statusBadge(fee.payment!.status)}
                      </td>
                      <td className="py-3">
                        {fee.payment!.paidAt
                          ? new Date(fee.payment!.paidAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3">
                        {fee.payment!.receiptUrl ? (
                          <a
                            href={fee.payment!.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Download
                          </a>
                        ) : (
                          "-"
                        )}
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
