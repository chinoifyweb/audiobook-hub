"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  ImageIcon,
  FileAudio,
  FileText,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Fantasy",
  "Biography",
  "Self-Help",
  "Business",
  "History",
  "Children",
  "Horror",
  "Thriller",
  "Poetry",
  "Religion",
  "Education",
  "Technology",
  "Health",
  "Travel",
  "Other",
];

const LANGUAGES = ["English", "Yoruba", "Igbo", "Hausa", "Pidgin", "French", "Other"];

const STEPS = [
  { label: "Book Details", number: 1 },
  { label: "Pricing", number: 2 },
  { label: "Cover Image", number: 3 },
  { label: "Upload Files", number: 4 },
  { label: "Review & Submit", number: 5 },
];

interface ChapterInput {
  chapterNumber: number;
  chapterTitle: string;
  file: File | null;
}

export default function NewBookPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Book Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [subGenre, setSubGenre] = useState("");
  const [language, setLanguage] = useState("English");
  const [isbn, setIsbn] = useState("");
  const [bookType, setBookType] = useState<"ebook" | "audiobook" | "both">("audiobook");

  // Step 2: Pricing
  const [priceNaira, setPriceNaira] = useState("");
  const [isFree, setIsFree] = useState(false);

  // Step 3: Cover
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Step 4: Files
  const [chapters, setChapters] = useState<ChapterInput[]>([
    { chapterNumber: 1, chapterTitle: "", file: null },
  ]);
  const [ebookFile, setEbookFile] = useState<File | null>(null);

  const priceKobo = isFree ? 0 : Math.round(parseFloat(priceNaira || "0") * 100);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function addChapter() {
    setChapters((prev) => [
      ...prev,
      { chapterNumber: prev.length + 1, chapterTitle: "", file: null },
    ]);
  }

  function removeChapter(index: number) {
    setChapters((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((ch, i) => ({ ...ch, chapterNumber: i + 1 }));
    });
  }

  function updateChapter(
    index: number,
    field: keyof ChapterInput,
    value: string | File | null
  ) {
    setChapters((prev) =>
      prev.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch))
    );
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return title.trim().length > 0 && genre.length > 0;
      case 2:
        return isFree || parseFloat(priceNaira) >= 500;
      case 3:
        return true; // cover is optional during creation
      case 4:
        return true; // files can be added later
      default:
        return true;
    }
  }

  async function handleSubmit(asDraft: boolean) {
    setIsSubmitting(true);
    try {
      const body = {
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
        status: asDraft ? "draft" : "pending_review",
      };

      const res = await fetch("/api/author/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to create book");
        return;
      }

      await res.json();
      router.push("/author/books");
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload New Book</h1>
        <p className="text-muted-foreground">
          Fill in the details below to add a new book to the platform.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => (
          <div key={step.number} className="flex items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(step.number)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                currentStep === step.number
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.number
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.number ? (
                <Check className="h-3 w-3" />
              ) : (
                <span>{step.number}</span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-4 bg-border sm:w-8" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Book Details */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
            <CardDescription>
              Basic information about your book.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full book description..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDesc">Short Description</Label>
              <Input
                id="shortDesc"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief tagline or summary (1-2 sentences)"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Genre *</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
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
                  placeholder="e.g., Urban Fantasy"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN (optional)</Label>
                <Input
                  id="isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-3-16-148410-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Book Type *</Label>
              <Select
                value={bookType}
                onValueChange={(v) => setBookType(v as typeof bookType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audiobook">Audiobook</SelectItem>
                  <SelectItem value="ebook">Ebook</SelectItem>
                  <SelectItem value="both">Both (Audiobook + Ebook)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Pricing */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>
              Set the price for your book. The platform takes a 30% commission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isFree"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isFree">This book is free</Label>
            </div>

            {!isFree && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (NGN) *</Label>
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
                      placeholder="2000"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum price: &#8358;500
                  </p>
                </div>

                {parseFloat(priceNaira) > 0 && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="text-sm font-semibold">Commission Breakdown</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Selling Price</span>
                        <span className="font-medium">
                          &#8358;{parseFloat(priceNaira).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>You Earn (70%)</span>
                        <span className="font-medium">
                          &#8358;{(parseFloat(priceNaira) * 0.7).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Platform Fee (30%)</span>
                        <span>
                          &#8358;{(parseFloat(priceNaira) * 0.3).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Cover Image */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
            <CardDescription>
              Upload a high-quality cover image for your book.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Preview */}
              <div className="flex h-64 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      No cover uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* Upload area */}
              <div className="flex-1 space-y-4">
                <div className="rounded-lg border-2 border-dashed p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or WebP (recommended: 1600x2400px)
                  </p>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    className="mt-4"
                  />
                </div>
                {coverFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {coverFile.name} (
                    {(coverFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: File Upload */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              {bookType === "ebook"
                ? "Upload your ebook file (EPUB or PDF)."
                : bookType === "audiobook"
                  ? "Upload audio files for each chapter."
                  : "Upload both audio files and ebook file."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio chapters */}
            {(bookType === "audiobook" || bookType === "both") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileAudio className="h-4 w-4" />
                    Audio Chapters
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChapter}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Chapter
                  </Button>
                </div>

                {chapters.map((ch, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end"
                  >
                    <div className="w-16 shrink-0">
                      <Label className="text-xs">Ch. #</Label>
                      <Input
                        type="number"
                        value={ch.chapterNumber}
                        readOnly
                        className="text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Chapter Title</Label>
                      <Input
                        value={ch.chapterTitle}
                        onChange={(e) =>
                          updateChapter(i, "chapterTitle", e.target.value)
                        }
                        placeholder={`Chapter ${ch.chapterNumber} title`}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Audio File</Label>
                      <Input
                        type="file"
                        accept="audio/mpeg,audio/aac,audio/mp4,audio/x-m4a"
                        onChange={(e) =>
                          updateChapter(i, "file", e.target.files?.[0] || null)
                        }
                      />
                    </div>
                    {chapters.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChapter(i)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Supported formats: MP3, AAC, M4A, M4B. Max 500 MB per file.
                </p>
              </div>
            )}

            {/* Ebook file */}
            {(bookType === "ebook" || bookType === "both") && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ebook File
                </h3>
                <div className="rounded-lg border-2 border-dashed p-6 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload your ebook file
                  </p>
                  <p className="text-xs text-muted-foreground">
                    EPUB or PDF format
                  </p>
                  <Input
                    type="file"
                    accept=".epub,.pdf"
                    onChange={(e) => setEbookFile(e.target.files?.[0] || null)}
                    className="mx-auto mt-4 max-w-xs"
                  />
                </div>
                {ebookFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {ebookFile.name} (
                    {(ebookFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Note: File uploads will be processed after the book record is created.
              You can also upload files later by editing the book.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>
              Review your book details before submitting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border divide-y">
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">Title</span>
                <span className="text-sm font-medium">{title || "---"}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">Genre</span>
                <span className="text-sm font-medium">{genre || "---"}</span>
              </div>
              {subGenre && (
                <div className="flex justify-between p-3">
                  <span className="text-sm text-muted-foreground">Sub-Genre</span>
                  <span className="text-sm font-medium">{subGenre}</span>
                </div>
              )}
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">Language</span>
                <span className="text-sm font-medium">{language}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">Book Type</span>
                <Badge variant="outline" className="capitalize">
                  {bookType}
                </Badge>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-sm font-medium">
                  {isFree
                    ? "Free"
                    : `\u20A6${parseFloat(priceNaira).toLocaleString()}`}
                </span>
              </div>
              {!isFree && parseFloat(priceNaira) > 0 && (
                <div className="flex justify-between p-3">
                  <span className="text-sm text-muted-foreground">
                    Your Earnings
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    &#8358;{(parseFloat(priceNaira) * 0.7).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">Cover</span>
                <span className="text-sm font-medium">
                  {coverFile ? coverFile.name : "Not uploaded"}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-sm text-muted-foreground">Description</span>
                <span className="max-w-[60%] text-right text-sm font-medium truncate">
                  {description
                    ? description.length > 80
                      ? description.slice(0, 80) + "..."
                      : description
                    : "---"}
                </span>
              </div>
              {isbn && (
                <div className="flex justify-between p-3">
                  <span className="text-sm text-muted-foreground">ISBN</span>
                  <span className="text-sm font-medium">{isbn}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save as Draft
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((s) => s - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        {currentStep < 5 && (
          <Button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
