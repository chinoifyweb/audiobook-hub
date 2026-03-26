"use client";

import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";






import { Loader2, Save, Send } from "lucide-react";

const GENRES = [
  "Fiction", "Non-Fiction", "Mystery", "Romance", "Sci-Fi", "Fantasy",
  "Biography", "Self-Help", "Business", "History", "Children", "Horror",
  "Thriller", "Poetry", "Religion", "Education", "Technology", "Health",
  "Travel", "Other",
];

const LANGUAGES = ["English", "Yoruba", "Igbo", "Hausa", "Pidgin", "French", "Other"];

interface EditBookFormProps {
  book: {
    id: string;
    title: string;
    description: string;
    shortDescription: string;
    genre: string;
    subGenre: string;
    language: string;
    isbn: string;
    bookType: string;
    price: number;
    isFree: boolean;
    status: string;
    rejectionReason: string | null;
    coverImageUrl: string | null;
    commissionRate: number;
  };
  isEditable: boolean;
}

export function EditBookForm({ book, isEditable }: EditBookFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState(book.title);
  const [description, setDescription] = useState(book.description);
  const [shortDescription, setShortDescription] = useState(book.shortDescription);
  const [genre, setGenre] = useState(book.genre);
  const [subGenre, setSubGenre] = useState(book.subGenre);
  const [language, setLanguage] = useState(book.language);
  const [isbn, setIsbn] = useState(book.isbn);
  const [bookType, setBookType] = useState(book.bookType);
  const [priceNaira, setPriceNaira] = useState(
    book.isFree ? "" : String(book.price / 100)
  );
  const [isFree, setIsFree] = useState(book.isFree);

  const commissionRate = book.commissionRate;
  const priceNum = parseFloat(priceNaira) || 0;

  async function handleSave(submitForReview: boolean) {
    setIsSubmitting(true);
    try {
      const priceKobo = isFree ? 0 : Math.round(priceNum * 100);
      const body: Record<string, unknown> = {
        title,
        description,
        shortDescription,
        genre,
        subGenre,
        language,
        isbn: isbn || undefined,
        bookType,
        price: priceKobo,
        isFree,
      };

      if (submitForReview) {
        body.status = "pending_review";
      }

      const res = await fetch(`/api/author/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to update book");
        return;
      }

      router.push("/author/books");
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge
          variant={
            book.status === "published"
              ? "default"
              : book.status === "rejected"
                ? "destructive"
                : "secondary"
          }
          className="capitalize"
        >
          {book.status.replace("_", " ")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isEditable}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isEditable}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDesc">Short Description</Label>
            <Input
              id="shortDesc"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              disabled={!isEditable}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Genre *</Label>
              <Select value={genre} onValueChange={setGenre} disabled={!isEditable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subGenre">Sub-Genre</Label>
              <Input
                id="subGenre"
                value={subGenre}
                onChange={(e) => setSubGenre(e.target.value)}
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={!isEditable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Book Type</Label>
            <Select
              value={bookType}
              onValueChange={setBookType}
              disabled={!isEditable}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audiobook">Audiobook</SelectItem>
                <SelectItem value="ebook">Ebook</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFree"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              disabled={!isEditable}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isFree">This book is free</Label>
          </div>

          {!isFree && (
            <>
              <div className="space-y-2">
                <Label htmlFor="price">Price (NGN)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    &#8358;
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="500"
                    step="100"
                    value={priceNaira}
                    onChange={(e) => setPriceNaira(e.target.value)}
                    disabled={!isEditable}
                    className="pl-8"
                  />
                </div>
              </div>

              {priceNum > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="text-sm font-semibold">Commission Breakdown</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Selling Price</span>
                      <span className="font-medium">
                        &#8358;{priceNum.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>You Earn ({(commissionRate * 100).toFixed(0)}%)</span>
                      <span className="font-medium">
                        &#8358;{(priceNum * commissionRate).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Platform Fee ({((1 - commissionRate) * 100).toFixed(0)}%)
                      </span>
                      <span>
                        &#8358;{(priceNum * (1 - commissionRate)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {isEditable && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSave(false)}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleSave(true)}
            disabled={isSubmitting || !title.trim() || !genre}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
}
