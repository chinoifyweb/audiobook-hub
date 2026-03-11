"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Star,
  StarOff,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface BookRow {
  id: string;
  title: string;
  slug: string;
  genre: string | null;
  price: number;
  status: string;
  isFeatured: boolean;
  bookType: string;
  coverImageUrl: string | null;
  createdAt: string;
  authorName: string;
  rejectionReason: string | null;
}

interface Props {
  books: BookRow[];
  total: number;
  page: number;
  totalPages: number;
  currentSearch: string;
  currentStatus: string;
  statusCounts: Record<string, number>;
}

const statusBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_review: { label: "Pending Review", variant: "outline" },
  published: { label: "Published", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  archived: { label: "Archived", variant: "secondary" },
};

export function BooksClient({
  books,
  total,
  page,
  totalPages,
  currentSearch,
  currentStatus,
  statusCounts,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateParams(params: Record<string, string>) {
    const sp = new URLSearchParams();
    const newSearch = params.search ?? search;
    const newStatus = params.status ?? currentStatus;
    const newPage = params.page ?? "1";

    if (newSearch) sp.set("search", newSearch);
    if (newStatus && newStatus !== "all") sp.set("status", newStatus);
    if (newPage !== "1") sp.set("page", newPage);

    startTransition(() => {
      router.push(`/admin/books?${sp.toString()}`);
    });
  }

  async function approveBook(bookId: string) {
    await fetch("/api/admin/books", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, action: "approve" }),
    });
    router.refresh();
  }

  async function rejectBook(bookId: string) {
    await fetch("/api/admin/books", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId,
        action: "reject",
        rejectionReason: rejectionReason || "No reason provided",
      }),
    });
    setRejectingId(null);
    setRejectionReason("");
    router.refresh();
  }

  async function toggleFeatured(bookId: string, isFeatured: boolean) {
    await fetch("/api/admin/books", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, isFeatured: !isFeatured }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <Tabs
        value={currentStatus || "all"}
        onValueChange={(val) => updateParams({ status: val, page: "1" })}
      >
        <TabsList>
          <TabsTrigger value="all">
            All ({statusCounts["all"] || 0})
          </TabsTrigger>
          <TabsTrigger value="pending_review">
            Pending ({statusCounts["pending_review"] || 0})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({statusCounts["published"] || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({statusCounts["rejected"] || 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ search, page: "1" });
            }}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => updateParams({ search, page: "1" })}
          disabled={isPending}
        >
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Book</th>
              <th className="px-4 py-3 text-left font-medium">Author</th>
              <th className="px-4 py-3 text-left font-medium">Genre</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No books found.
                </td>
              </tr>
            ) : (
              books.map((book, i) => (
                <tr
                  key={book.id}
                  className={`border-b transition-colors hover:bg-muted/30 ${
                    i % 2 === 0 ? "bg-background" : "bg-muted/10"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-7 flex-shrink-0 rounded bg-muted" />
                      <span className="font-medium">{book.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {book.authorName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {book.genre || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {book.price === 0 ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : (
                      formatPrice(book.price)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{book.bookType}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={statusBadge[book.status]?.variant || "secondary"}
                    >
                      {statusBadge[book.status]?.label || book.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(book.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Approve/Reject for pending */}
                      {book.status === "pending_review" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveBook(book.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          {rejectingId === book.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Rejection reason..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="h-8 w-48 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectBook(book.id)}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectionReason("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectingId(book.id)}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          )}
                        </>
                      )}

                      {/* Feature toggle for published */}
                      {book.status === "published" && (
                        <Button
                          size="sm"
                          variant={book.isFeatured ? "secondary" : "outline"}
                          onClick={() => toggleFeatured(book.id, book.isFeatured)}
                        >
                          {book.isFeatured ? (
                            <>
                              <StarOff className="mr-1 h-3 w-3" />
                              Unfeature
                            </>
                          ) : (
                            <>
                              <Star className="mr-1 h-3 w-3" />
                              Feature
                            </>
                          )}
                        </Button>
                      )}

                      {/* Show rejection reason */}
                      {book.status === "rejected" && book.rejectionReason && (
                        <span className="max-w-[200px] truncate text-xs text-red-500" title={book.rejectionReason}>
                          {book.rejectionReason}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} books)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
