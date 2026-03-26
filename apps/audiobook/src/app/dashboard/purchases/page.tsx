import { Card, CardContent, Badge, Button } from "@repo/ui";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { formatPrice } from "@/lib/utils";



import { ShoppingBag, ExternalLink, BookOpen } from "lucide-react";

export const dynamic = 'force-dynamic';

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  successful: "default",
  pending: "outline",
  failed: "destructive",
  refunded: "secondary",
};

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
          bookType: true,
          author: {
            include: {
              user: {
                select: { fullName: true },
              },
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase History</h1>
        <p className="text-muted-foreground mt-1">
          View all your past book purchases
        </p>
      </div>

      {purchases.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No Purchases Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven&apos;t purchased any books yet. Browse our catalog to
              find your next great read or listen.
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
        <Card>
          <CardContent className="p-0">
            {/* Desktop table header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
              <span>Book</span>
              <span className="w-28 text-right">Amount</span>
              <span className="w-24 text-center">Status</span>
              <span className="w-32 text-right">Date</span>
            </div>

            <div className="divide-y">
              {purchases.map((purchase) => {
                const authorName =
                  purchase.book.author.penName ||
                  purchase.book.author.user.fullName ||
                  "Unknown Author";

                return (
                  <div
                    key={purchase.id}
                    className="px-6 py-4 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4 sm:items-center"
                  >
                    {/* Book info */}
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      {purchase.book.coverImageUrl ? (
                        <img
                          src={purchase.book.coverImageUrl}
                          alt={purchase.book.title}
                          className="h-12 w-9 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-9 items-center justify-center rounded bg-muted shrink-0">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/books/${purchase.book.slug}`}
                          className="text-sm font-medium hover:underline line-clamp-1"
                        >
                          {purchase.book.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          by {authorName}
                        </p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between sm:justify-end sm:w-28 mb-1 sm:mb-0">
                      <span className="text-xs text-muted-foreground sm:hidden">
                        Amount:
                      </span>
                      <span className="text-sm font-medium">
                        {formatPrice(purchase.amountPaid)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between sm:justify-center sm:w-24 mb-1 sm:mb-0">
                      <span className="text-xs text-muted-foreground sm:hidden">
                        Status:
                      </span>
                      <Badge
                        variant={statusVariant[purchase.status] || "secondary"}
                      >
                        {purchase.status}
                      </Badge>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-between sm:justify-end sm:w-32">
                      <span className="text-xs text-muted-foreground sm:hidden">
                        Date:
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(
                          purchase.purchasedAt || purchase.createdAt
                        ).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {purchases.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing all {purchases.length} purchase
          {purchases.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
