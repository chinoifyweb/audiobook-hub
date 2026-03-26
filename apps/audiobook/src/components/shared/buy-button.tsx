"use client";

import { Button } from "@repo/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Loader2, ShoppingCart, BookOpen, CheckCircle } from "lucide-react";

interface BuyButtonProps {
  bookId: string;
  price: number; // in kobo
  discountPrice?: number | null;
  isFree: boolean;
  bookType: "ebook" | "audiobook" | "both";
  hasPurchased: boolean;
}

function formatPrice(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

export function BuyButton({
  bookId,
  price,
  discountPrice,
  isFree,
  hasPurchased,
}: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const displayPrice = discountPrice ?? price;

  async function handlePurchase() {
    setIsLoading(true);
    setError(null);

    try {
      if (isFree) {
        // Claim free book directly
        const res = await fetch("/api/purchases/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to claim free book");
        }

        // Refresh the page to show updated state
        router.refresh();
        return;
      }

      // Initialize paid purchase
      const res = await fetch("/api/purchases/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize purchase");
      }

      // Redirect to Paystack checkout
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }

  if (hasPurchased) {
    return (
      <Button variant="secondary" disabled className="w-full gap-2">
        <CheckCircle className="h-4 w-4" />
        Already Purchased
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePurchase}
        disabled={isLoading}
        className="w-full gap-2"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : isFree ? (
          <>
            <BookOpen className="h-4 w-4" />
            Get for Free
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            Buy Now {formatPrice(displayPrice)}
            {discountPrice && discountPrice < price && (
              <span className="ml-1 text-xs line-through opacity-70">
                {formatPrice(price)}
              </span>
            )}
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
