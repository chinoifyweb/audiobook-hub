import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink } from "lucide-react";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
        <p className="text-muted-foreground mt-1">
          Books you&apos;ve saved for later
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Wishlist Coming Soon</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We&apos;re building the wishlist feature so you can save books
            you&apos;re interested in and get notified about price changes and
            new releases. Stay tuned!
          </p>
          <Button asChild>
            <Link href="/books">
              Browse Books
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Grid layout ready for future wishlist items */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Placeholder cards to show the intended layout */}
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="opacity-40">
            <CardContent className="p-4">
              <div className="aspect-[2/3] rounded-md bg-muted mb-3" />
              <div className="h-4 w-3/4 rounded bg-muted mb-2" />
              <div className="h-3 w-1/2 rounded bg-muted mb-3" />
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-8 w-20 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
