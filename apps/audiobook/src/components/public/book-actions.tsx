"use client";

import { Button } from "@repo/ui";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Loader2, Heart, Check } from "lucide-react";

interface BookActionsProps {
  bookId: string;
  bookSlug: string;
  title: string;
  coverImageUrl: string | null;
  bookType: string;
  price: number;
  isFree: boolean;
  authorName: string;
}

const WISHLIST_KEY = "audiobook_wishlist";

interface WishlistItem {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  bookType: string;
  price: number;
  isFree: boolean;
  authorName: string;
  addedAt?: string;
}

function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function isInWishlist(bookId: string): boolean {
  return getWishlist().some((item) => item.id === bookId);
}

function toggleWishlistItem(book: {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  bookType: string;
  price: number;
  isFree: boolean;
  authorName: string;
}): boolean {
  const items = getWishlist();
  const exists = items.some((item) => item.id === book.id);

  if (exists) {
    const filtered = items.filter((item) => item.id !== book.id);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("wishlist-updated"));
    return false; // removed
  } else {
    items.push({ ...book, addedAt: new Date().toISOString() });
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("wishlist-updated"));
    return true; // added
  }
}

export function BookActions({
  bookId,
  bookSlug,
  title,
  coverImageUrl,
  bookType,
  price,
  isFree,
  authorName,
}: BookActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [inWishlist, setInWishlist] = useState(() => isInWishlist(bookId));

  const handleBuy = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/books/${bookSlug}`);
      return;
    }

    setBuyLoading(true);
    setBuyError(null);

    try {
      if (isFree) {
        // Use the free purchase endpoint
        const res = await fetch("/api/purchases/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });

        if (res.ok) {
          router.push("/dashboard");
        } else {
          const data = await res.json();
          setBuyError(data.error || "Failed to get this book. Please try again.");
        }
      } else {
        // Initialize Paystack payment
        const res = await fetch("/api/purchases/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });

        const data = await res.json();

        if (res.ok && data.authorizationUrl) {
          // Redirect to Paystack checkout
          window.location.href = data.authorizationUrl;
        } else {
          setBuyError(data.error || "Failed to initialize payment. Please try again.");
        }
      }
    } catch {
      setBuyError("Something went wrong. Please try again.");
    } finally {
      setBuyLoading(false);
    }
  };

  const handleWishlistToggle = () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/books/${bookSlug}`);
      return;
    }

    const added = toggleWishlistItem({
      id: bookId,
      title,
      slug: bookSlug,
      coverImageUrl,
      bookType,
      price,
      isFree,
      authorName,
    });
    setInWishlist(added);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          className="min-w-[160px]"
          onClick={handleBuy}
          disabled={buyLoading}
        >
          {buyLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isFree ? (
            "Get for Free"
          ) : (
            "Buy Now"
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className={`gap-2 ${inWishlist ? "text-red-500 border-red-200 hover:text-red-600" : ""}`}
          onClick={handleWishlistToggle}
        >
          {inWishlist ? (
            <>
              <Check className="h-5 w-5" />
              In Wishlist
            </>
          ) : (
            <>
              <Heart className="h-5 w-5" />
              Add to Wishlist
            </>
          )}
        </Button>
      </div>
      {buyError && (
        <p className="text-sm text-red-600">{buyError}</p>
      )}
    </div>
  );
}
