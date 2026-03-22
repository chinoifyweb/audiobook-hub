"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Card, CardContent, Button } from "@repo/ui";
import { Lock, CreditCard, MessageCircle, HelpCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface PaymentStatusData {
  hasPaid: boolean;
  hasScholarship: boolean;
  amountDue: number;
  amountPaid: number;
  balance: number;
  programName: string;
  programCode: string;
  semesterName: string;
  sessionName: string;
}

const PaymentStatusContext = createContext<{
  status: PaymentStatusData | null;
  loading: boolean;
}>({ status: null, loading: true });

export function usePaymentStatus() {
  return useContext(PaymentStatusContext);
}

/**
 * Client-side provider that fetches payment status once and provides it
 * to all child PaymentGateClient components.
 */
export function PaymentStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<PaymentStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payment-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          // On error, assume paid to avoid blocking
          setStatus({
            hasPaid: true,
            hasScholarship: false,
            amountDue: 0,
            amountPaid: 0,
            balance: 0,
            programName: "",
            programCode: "",
            semesterName: "",
            sessionName: "",
          });
        } else {
          setStatus(data);
        }
      })
      .catch(() => {
        setStatus({
          hasPaid: true,
          hasScholarship: false,
          amountDue: 0,
          amountPaid: 0,
          balance: 0,
          programName: "",
          programCode: "",
          semesterName: "",
          sessionName: "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PaymentStatusContext.Provider value={{ status, loading }}>
      {children}
    </PaymentStatusContext.Provider>
  );
}

interface PaymentGateClientProps {
  children: React.ReactNode;
  message?: string;
  /** If true, shows a loading spinner while checking status */
  showLoader?: boolean;
}

/**
 * Client component that wraps protected content.
 * Uses the PaymentStatusProvider context or fetches its own status.
 */
export function PaymentGateClient({
  children,
  message,
  showLoader = false,
}: PaymentGateClientProps) {
  const ctx = useContext(PaymentStatusContext);
  const [localStatus, setLocalStatus] = useState<PaymentStatusData | null>(null);
  const [localLoading, setLocalLoading] = useState(true);

  // If no provider, fetch our own
  useEffect(() => {
    if (ctx.status !== null) {
      setLocalStatus(ctx.status);
      setLocalLoading(ctx.loading);
      return;
    }
    fetch("/api/payment-status")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setLocalStatus(data);
        } else {
          // Fail open
          setLocalStatus({
            hasPaid: true,
            hasScholarship: false,
            amountDue: 0,
            amountPaid: 0,
            balance: 0,
            programName: "",
            programCode: "",
            semesterName: "",
            sessionName: "",
          });
        }
      })
      .catch(() => {
        setLocalStatus({
          hasPaid: true,
          hasScholarship: false,
          amountDue: 0,
          amountPaid: 0,
          balance: 0,
          programName: "",
          programCode: "",
          semesterName: "",
          sessionName: "",
        });
      })
      .finally(() => setLocalLoading(false));
  }, [ctx]);

  const status = ctx.status ?? localStatus;
  const loading = ctx.status !== null ? ctx.loading : localLoading;

  if (loading) {
    if (showLoader) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return null;
  }

  if (!status || status.hasPaid || status.hasScholarship) {
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

          {status.programName && (
            <div className="rounded-lg bg-white border border-orange-200 p-4 mb-5 text-left text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Program:</span>
                <span className="font-medium text-gray-900">
                  {status.programName}
                </span>
                {status.semesterName && (
                  <>
                    <span className="text-gray-500">Semester:</span>
                    <span className="font-medium text-gray-900">
                      {status.sessionName && `${status.sessionName} - `}
                      {status.semesterName}
                    </span>
                  </>
                )}
                <span className="text-gray-500">Amount Due:</span>
                <span className="font-bold text-orange-700">
                  {"\u20A6"}
                  {(status.balance / 100).toLocaleString()}
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
