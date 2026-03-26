import { Card, CardContent, Button, Badge } from "@repo/ui";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { BookStatus } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";



import {
  Upload,
  Pencil,
  Star,
  Download,
  BookOpen,
} from "lucide-react";

export const dynamic = 'force-dynamic';

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_review: { label: "Pending Review", variant: "outline" },
  published: { label: "Published", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  archived: { label: "Archived", variant: "secondary" },
};

export default async function MyBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const authorProfile = await prisma.authorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!authorProfile) redirect("/dashboard");

  const params = await searchParams;
  const statusFilter = params.status;

  const books = await prisma.book.findMany({
    where: {
      authorId: authorProfile.id,
      ...(statusFilter && statusFilter !== "all"
        ? { status: statusFilter as BookStatus }
        : {}),
    },
    include: {
      _count: { select: { purchases: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["all", "draft", "pending_review", "published", "rejected", "archived"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Books</h1>
          <p className="text-muted-foreground">
            Manage your uploaded books and track their status.
          </p>
        </div>
        <Button asChild>
          <Link href="/author/books/new">
            <Upload className="mr-2 h-4 w-4" />
            Upload New Book
          </Link>
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const isActive =
            s === "all" ? !statusFilter || statusFilter === "all" : statusFilter === s;
          const config = s !== "all" ? statusConfig[s] : null;
          return (
            <Link
              key={s}
              href={s === "all" ? "/author/books" : `/author/books?status=${s}`}
            >
              <Badge
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 text-xs capitalize"
              >
                {config ? config.label : "All"}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Books grid */}
      {books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No books found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter && statusFilter !== "all"
                ? `You have no books with status "${statusConfig[statusFilter]?.label || statusFilter}".`
                : "Upload your first book to get started."}
            </p>
            <Button asChild className="mt-6">
              <Link href="/author/books/new">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Book
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => {
            const config = statusConfig[book.status] || {
              label: book.status,
              variant: "secondary" as const,
            };
            return (
              <Card key={book.id} className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Cover thumbnail */}
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-muted">
                    {book.coverImageUrl ? (
                      <Image
                        src={book.coverImageUrl}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold">
                        {book.title}
                      </h3>
                      <Badge variant={config.variant} className="shrink-0 text-xs">
                        {config.label}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm font-medium text-primary">
                      {book.isFree ? "Free" : formatPrice(book.price)}
                    </p>

                    <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                      {book.ratingCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {Number(book.ratingAverage).toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {book._count.purchases} sales
                      </span>
                      <span className="capitalize">{book.bookType}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(book.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/author/books/${book.id}/edit`}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                </div>

                {/* Rejection reason */}
                {book.status === "rejected" && book.rejectionReason && (
                  <div className="border-t bg-destructive/5 px-4 py-2">
                    <p className="text-xs text-destructive">
                      <strong>Reason:</strong> {book.rejectionReason}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
