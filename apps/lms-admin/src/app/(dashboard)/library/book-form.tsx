"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
} from "@repo/ui";
import {
  ArrowLeft,
  Upload,
  BookOpen,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import {
  supabase,
  LIBRARY_BOOKS_BUCKET,
  LIBRARY_COVERS_BUCKET,
} from "@/lib/supabase";

const CATEGORIES = [
  "Biblical Studies",
  "Systematic Theology",
  "Church History",
  "Pastoral Ministry",
  "Missions & Evangelism",
  "Christian Education",
  "Counselling & Psychology",
  "Leadership & Administration",
  "Marriage & Family",
  "Devotional & Spiritual Formation",
  "Biblical Languages (Greek/Hebrew)",
  "Ethics & Philosophy",
  "African Theology",
  "Digital Ministry & Technology",
  "Reference & Dictionaries",
];

const ACCEPTED_BOOK_TYPES = ".pdf,.epub,.docx";
const ACCEPTED_IMAGE_TYPES = ".jpg,.jpeg,.png,.webp";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface BookData {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  coverImageUrl: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  isbn: string | null;
  publisher: string | null;
  publicationYear: number | null;
  language: string;
  tags: string[];
  isPublic: boolean;
}

interface LibraryBookFormProps {
  book?: BookData;
}

export function LibraryBookForm({ book }: LibraryBookFormProps) {
  const router = useRouter();
  const isEditing = !!book;

  const [title, setTitle] = useState(book?.title || "");
  const [author, setAuthor] = useState(book?.author || "");
  const [description, setDescription] = useState(book?.description || "");
  const [category, setCategory] = useState(book?.category || "");
  const [subcategory, setSubcategory] = useState(book?.subcategory || "");
  const [isbn, setIsbn] = useState(book?.isbn || "");
  const [publisher, setPublisher] = useState(book?.publisher || "");
  const [publicationYear, setPublicationYear] = useState(
    book?.publicationYear?.toString() || "",
  );
  const [language, setLanguage] = useState(book?.language || "English");
  const [tagsInput, setTagsInput] = useState(book?.tags?.join(", ") || "");
  const [isPublic, setIsPublic] = useState(book?.isPublic !== false);

  // File states
  const [fileUrl, setFileUrl] = useState(book?.fileUrl || "");
  const [fileType, setFileType] = useState(book?.fileType || "");
  const [fileSize, setFileSize] = useState(book?.fileSize || "0");
  const [coverImageUrl, setCoverImageUrl] = useState(
    book?.coverImageUrl || "",
  );

  // Upload states
  const [bookUploading, setBookUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [bookProgress, setBookProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(
    file: File,
    bucket: string,
  ): Promise<{ url: string; path: string }> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${timestamp}_${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, path: filePath };
  }

  async function handleBookFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 100MB limit");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "epub", "docx"].includes(ext)) {
      setError("Only PDF, EPUB, and DOCX files are supported");
      return;
    }

    setBookUploading(true);
    setBookProgress(10);
    setError("");

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setBookProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await uploadFile(file, LIBRARY_BOOKS_BUCKET);

      clearInterval(progressInterval);
      setBookProgress(100);
      setFileUrl(result.url);
      setFileType(ext);
      setFileSize(file.size.toString());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload book file",
      );
    } finally {
      setBookUploading(false);
      setTimeout(() => setBookProgress(0), 1000);
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Cover image must be under 5MB");
      return;
    }

    setCoverUploading(true);
    setError("");

    try {
      const result = await uploadFile(file, LIBRARY_COVERS_BUCKET);
      setCoverImageUrl(result.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload cover image",
      );
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title || !author || !category) {
      setError("Title, Author, and Category are required");
      return;
    }
    if (!fileUrl && !isEditing) {
      setError("Please upload a book file");
      return;
    }

    setSaving(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const body = {
        title,
        author,
        description: description || null,
        category,
        subcategory: subcategory || null,
        coverImageUrl: coverImageUrl || null,
        fileUrl,
        fileType,
        fileSize,
        isbn: isbn || null,
        publisher: publisher || null,
        publicationYear: publicationYear || null,
        language,
        tags,
        isPublic,
      };

      const url = isEditing ? `/api/library/${book.id}` : "/api/library";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save book");
      }

      router.push("/library");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/library">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Link>
      </Button>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter book title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the book..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Optional subcategory"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="ISBN number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Publisher name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Publication Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                    placeholder="e.g. 2024"
                    min="1900"
                    max="2100"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. English"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Comma-separated tags"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Book File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fileUrl ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {fileType.toUpperCase()} file uploaded
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(fileSize)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFileUrl("");
                      setFileType("");
                      setFileSize("0");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label
                    htmlFor="book-file"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Click to upload book file
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, EPUB, or DOCX (max 100MB)
                    </p>
                  </label>
                  <input
                    id="book-file"
                    type="file"
                    accept={ACCEPTED_BOOK_TYPES}
                    onChange={handleBookFileChange}
                    className="hidden"
                    disabled={bookUploading}
                  />
                </div>
              )}
              {bookUploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                  <Progress value={bookProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coverImageUrl ? (
                <div className="relative">
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full rounded-lg border object-cover aspect-[3/4]"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => setCoverImageUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="cover-file"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 aspect-[3/4] transition-colors hover:border-primary/50 hover:bg-muted/50"
                >
                  {coverUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-xs text-center text-muted-foreground">
                        Upload cover image
                      </p>
                    </>
                  )}
                </label>
              )}
              <input
                id="cover-file"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleCoverChange}
                className="hidden"
                disabled={coverUploading}
              />
            </CardContent>
          </Card>

          {/* Access Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Access Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Public Access</p>
                  <p className="text-xs text-muted-foreground">
                    Anyone can browse and download
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublic ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPublic
                  ? "This book will be visible to everyone, including the public website."
                  : "This book will only be accessible to enrolled students."}
              </p>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={saving || bookUploading || coverUploading}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Book"
                ) : (
                  "Add Book"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/library")}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function formatSize(bytes: string): string {
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
