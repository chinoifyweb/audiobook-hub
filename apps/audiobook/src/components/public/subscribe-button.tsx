"use client";

import { Button } from "@repo/ui";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";

interface SubscribeButtonProps {
  planId: string;
  variant?: "default" | "outline";
  className?: string;
}

export function SubscribeButton({
  planId,
  variant = "default",
  className = "",
}: SubscribeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (res.ok && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setError(data.error || "Failed to initialize subscription.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        className={`w-full ${className}`}
        variant={variant}
        size="lg"
        onClick={handleSubscribe}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe Now"
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
