"use client";

import { Badge, Button, Input, Tabs, TabsList, TabsTrigger } from "@repo/ui";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";




import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface AuthorRow {
  id: string;
  penName: string | null;
  email: string;
  fullName: string | null;
  isApproved: boolean;
  isActive: boolean;
  commissionRate: number;
  totalEarnings: number;
  pendingPayout: number;
  bookCount: number;
  createdAt: string;
}

interface Props {
  authors: AuthorRow[];
  total: number;
  page: number;
  totalPages: number;
  currentSearch: string;
  currentStatus: string;
}

export function AuthorsClient({
  authors,
  total,
  page,
  totalPages,
  currentSearch,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");
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
      router.push(`/admin/authors?${sp.toString()}`);
    });
  }

  async function approveAuthor(authorId: string) {
    await fetch("/api/admin/authors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId, action: "approve" }),
    });
    router.refresh();
  }

  async function rejectAuthor(authorId: string) {
    await fetch("/api/admin/authors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId, action: "reject" }),
    });
    router.refresh();
  }

  async function updateCommission(authorId: string) {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate < 0 || rate > 1) return;

    await fetch("/api/admin/authors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId, commissionRate: rate }),
    });
    setEditingId(null);
    setEditRate("");
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
          <TabsTrigger value="all">All Authors</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
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
              <th className="px-4 py-3 text-left font-medium">Pen Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Commission</th>
              <th className="px-4 py-3 text-left font-medium">Earnings</th>
              <th className="px-4 py-3 text-left font-medium">Books</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {authors.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No authors found.
                </td>
              </tr>
            ) : (
              authors.map((author, i) => (
                <tr
                  key={author.id}
                  className={`border-b transition-colors hover:bg-muted/30 ${
                    i % 2 === 0 ? "bg-background" : "bg-muted/10"
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    {author.penName || author.fullName || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {author.email}
                  </td>
                  <td className="px-4 py-3">
                    {author.isApproved ? (
                      <Badge variant="default" className="bg-green-600">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === author.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="h-7 w-20 text-xs"
                          placeholder="0.70"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => updateCommission(author.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingId(null);
                            setEditRate("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>{(author.commissionRate * 100).toFixed(0)}%</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingId(author.id);
                            setEditRate(String(author.commissionRate));
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">
                        {formatPrice(author.totalEarnings * 100)}
                      </span>
                      {author.pendingPayout > 0 && (
                        <p className="text-xs text-yellow-600">
                          Pending: {formatPrice(author.pendingPayout * 100)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{author.bookCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(author.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!author.isApproved && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveAuthor(author.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectAuthor(author.id)}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </>
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
            Page {page} of {totalPages} ({total} authors)
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
