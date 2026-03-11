"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ExternalLink,
  BookOpen,
  Headphones,
  Trash2,
  Loader2,
} from "lucide-react";

export interface WishlistItem {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  bookType: string;
  price: number;
  isFree: boolean;
  authorName: string;
  addedAt: string;
}

const WISHLIST_KEY = "audiobook_wishlist";

function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function removeFromWishlistStorage(bookId: string): WishlistItem[] {
  const items = getWishlist().filter((item) => item.id !== bookId);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  // Dispatch event so other components can react
  window.dispatchEvent(new Event("wishlist-updated"));
  return items;
}

function formatPrice(priceInKobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(priceInKobo / 100);
}

export default function WishlistPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(() => {
    setItems(getWishlist());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWishlist();

    // Listen for wishlist updates from other tabs or components
    const handleStorageChange = () => loadWishlist();
    window.addEventListener("wishlist-updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("wishlist-updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadWishlist]);

  const handleRemove = (bookId: string) => {
    const updated = removeFromWishlistStorage(bookId);
    setItems(updated);
  };

  if (!session?.user) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
          <p className="text-muted-foreground mt-1">
            Books you&apos;ve saved for later
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
        <p className="text-muted-foreground mt-1">
          Books you&apos;ve saved for later
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Your Wishlist is Empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Browse our catalog and click the heart icon on any book to add it
              to your wishlist. You&apos;ll be able to easily find and purchase
              them later.
            </p>
            <Button asChild>
              <Link href="/books">
                Browse Books
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <Link href={`/books/${book.slug}`}>
                    <div className="aspect-[2/3] rounded-md bg-muted mb-3 overflow-hidden">
                      {book.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          {book.bookType === "audiobook" ||
                          book.bookType === "both" ? (
                            <Headphones className="h-10 w-10 text-muted-foreground/40" />
                          ) : (
                            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                  <Link
                    href={`/books/${book.slug}`}
                    className="text-sm font-semibold hover:underline line-clamp-2"
                  >
                    {book.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    {book.authorName}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {book.isFree ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        <span className="text-sm font-semibold text-primary">
                          {formatPrice(book.price)}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemove(book.id)}
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button asChild size="sm" className="w-full mt-2">
                    <Link href={`/books/${book.slug}`}>View Book</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {items.length} book{items.length !== 1 ? "s" : ""} in your wishlist
          </p>
        </>
      )}
    </div>
  );
}
