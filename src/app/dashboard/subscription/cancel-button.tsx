"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  periodEnd?: string;
}

export function CancelSubscriptionButton({
  subscriptionId,
  periodEnd,
}: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Error handling is best-effort
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-3 w-full rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <div className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Are you sure you want to cancel?</p>
            <p className="mt-1 opacity-80">
              Your subscription will remain active until{" "}
              {periodEnd
                ? new Date(periodEnd).toLocaleDateString("en-NG", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "the end of your current billing period"}
              . After that, you will lose access to subscription-only content.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirm(false)}
            disabled={isLoading}
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? "Cancelling..." : "Yes, Cancel"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950"
      onClick={() => setShowConfirm(true)}
    >
      Cancel Subscription
    </Button>
  );
}
