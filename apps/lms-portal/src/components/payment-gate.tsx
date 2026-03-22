import { Card, CardContent, Button } from "@repo/ui";
import { Lock, CreditCard, MessageCircle, HelpCircle } from "lucide-react";
import Link from "next/link";
import type { PaymentStatus } from "@/lib/payment-status";

interface PaymentGateProps {
  paymentStatus: PaymentStatus;
  children: React.ReactNode;
  /** Custom message to show when blocked */
  message?: string;
}

/**
 * Server component that wraps protected content.
 * If the student has paid or has a scholarship, shows children normally.
 * Otherwise, shows a professional "Payment Required" card.
 */
export function PaymentGate({
  paymentStatus,
  children,
  message,
}: PaymentGateProps) {
  if (paymentStatus.hasPaid || paymentStatus.hasScholarship) {
    return <>{children}</>;
  }

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardContent className="py-10">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-5">
            <Lock className="h-8 w-8 text-orange-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Payment Required
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            {message ||
              "Complete your tuition payment to access this feature."}
          </p>

          {paymentStatus.programName && (
            <div className="rounded-lg bg-white border border-orange-200 p-4 mb-5 text-left text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Program:</span>
                <span className="font-medium text-gray-900">
                  {paymentStatus.programName}
                </span>
                {paymentStatus.semesterName && (
                  <>
                    <span className="text-gray-500">Semester:</span>
                    <span className="font-medium text-gray-900">
                      {paymentStatus.sessionName && `${paymentStatus.sessionName} - `}
                      {paymentStatus.semesterName}
                    </span>
                  </>
                )}
                <span className="text-gray-500">Amount Due:</span>
                <span className="font-bold text-orange-700">
                  {"\u20A6"}
                  {(paymentStatus.balance / 100).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/payments">
              <Button className="w-full sm:w-auto gap-2">
                <CreditCard className="h-4 w-4" />
                Pay Tuition
              </Button>
            </Link>
            <a
              href="https://wa.me/2348000000000?text=Hello%2C%20I%20need%20help%20with%20my%20tuition%20payment"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Support
              </Button>
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            <HelpCircle className="h-3 w-3 inline mr-1" />
            Have a scholarship or waiver? Contact the admin office.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard-level payment banner for the main dashboard page.
 * Shows a prominent warning banner when tuition is outstanding.
 */
export function PaymentBanner({
  paymentStatus,
}: {
  paymentStatus: PaymentStatus;
}) {
  if (paymentStatus.hasPaid || paymentStatus.hasScholarship) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="rounded-lg bg-amber-100 p-2 shrink-0 mt-0.5">
            <CreditCard className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Tuition Payment Outstanding
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Your access to course materials, assessments, and downloads is
              limited until payment is complete.
            </p>
            {paymentStatus.balance > 0 && (
              <p className="text-sm font-semibold text-amber-900 mt-1.5">
                {"\u20A6"}
                {(paymentStatus.balance / 100).toLocaleString()} for{" "}
                {paymentStatus.programName}
                {paymentStatus.semesterName &&
                  ` - ${paymentStatus.semesterName}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/payments">
            <Button size="sm" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Pay Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
