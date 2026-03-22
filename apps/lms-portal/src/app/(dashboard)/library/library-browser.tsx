"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui";
import {
  BookOpen,
  Download,
  Search,
  FileText,
  File,
  Globe,
  Heart,
  Clock,
  BookMarked,
  Church,
  History,
  Users,
  GraduationCap,
  Lightbulb,
  Languages,
  Scale,
  Landmark,
  Monitor,
  BookCopy,
  Loader2,
  Eye,
  ArrowDownAZ,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";

interface LibraryBook {
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
  publisher: string | null;
  publicationYear: number | null;
  language: string;
  tags: string[];
  downloadCount: number;
  isPublic: boolean;
  isbn: string | null;
  createdAt: string;
}

interface LibraryBrowserProps {
  books: LibraryBook[];
  categories: string[];
  categoryCounts: Record<string, number>;
  totalBooks: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Biblical Studies": <BookOpen className="h-5 w-5" />,
  "Systematic Theology": <Church className="h-5 w-5" />,
  "Church History": <History className="h-5 w-5" />,
  "Pastoral Ministry": <Heart className="h-5 w-5" />,
  "Missions & Evangelism": <Globe className="h-5 w-5" />,
  "Christian Education": <GraduationCap className="h-5 w-5" />,
  "Counselling & Psychology": <Users className="h-5 w-5" />,
  "Leadership & Administration": <Landmark className="h-5 w-5" />,
  "Marriage & Family": <Heart className="h-5 w-5" />,
  "Devotional & Spiritual Formation": <Sparkles className="h-5 w-5" />,
  "Biblical Languages (Greek/Hebrew)": <Languages className="h-5 w-5" />,
  "Ethics & Philosophy": <Scale className="h-5 w-5" />,
  "African Theology": <Lightbulb className="h-5 w-5" />,
  "Digital Ministry & Technology": <Monitor className="h-5 w-5" />,
  "Reference & Dictionaries": <BookCopy className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Biblical Studies": "bg-blue-50 text-blue-700 border-blue-200",
  "Systematic Theology": "bg-purple-50 text-purple-700 border-purple-200",
  "Church History": "bg-amber-50 text-amber-700 border-amber-200",
  "Pastoral Ministry": "bg-rose-50 text-rose-700 border-rose-200",
  "Missions & Evangelism": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Christian Education": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Counselling & Psychology": "bg-pink-50 text-pink-700 border-pink-200",
  "Leadership & Administration": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Marriage & Family": "bg-red-50 text-red-700 border-red-200",
  "Devotional & Spiritual Formation": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Biblical Languages (Greek/Hebrew)": "bg-teal-50 text-teal-700 border-teal-200",
  "Ethics & Philosophy": "bg-slate-50 text-slate-700 border-slate-200",
  "African Theology": "bg-orange-50 text-orange-700 border-orange-200",
  "Digital Ministry & Technology": "bg-violet-50 text-violet-700 border-violet-200",
  "Reference & Dictionaries": "bg-gray-50 text-gray-700 border-gray-200",
};

function formatFileSize(bytes: string): string {
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeBadge(type: string) {
  const colors: Record<string, string> = {
    pdf: "bg-red-100 text-red-700",
    epub: "bg-green-100 text-green-700",
    docx: "bg-blue-100 text-blue-700",
  };
  return colors[type.toLowerCase()] || "bg-gray-100 text-gray-700";
}

export function LibraryBrowser({
  books,
  categories,
  categoryCounts,
  totalBooks,
}: LibraryBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = books.filter((book) => {
      const matchesSearch =
        !search ||
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase()) ||
        book.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (sortBy) {
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "downloads":
        result.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }

    return result;
  }, [books, search, selectedCategory, sortBy]);

  async function handleDownload(book: LibraryBook) {
    setDownloading(book.id);
    try {
      const res = await fetch(`/api/library/${book.id}/download`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.fileUrl, "_blank");
      } else {
        alert("Failed to download. Please try again.");
      }
    } catch {
      alert("Failed to download. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  const activeCats = categories.filter((cat) => (categoryCounts[cat] || 0) > 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU2IDAgMy0xLjM0NCAzLTNzLTEuMzQ0LTMtMy0zLTMgMS4zNDQtMyAzIDEuMzQ0IDMgMyAzem0wIDZjMS42NTYgMCAzLTEuMzQ0IDMtM3MtMS4zNDQtMy0zLTMtMyAxLjM0NC0zIDMgMS4zNDQgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <BookMarked className="h-8 w-8 text-amber-300" />
            <h1 className="text-2xl md:text-3xl font-bold">Digital Library</h1>
          </div>
          <p className="text-amber-200 mb-5 max-w-2xl">
            Browse our collection of {totalBooks} theological resources. Download books to study at your own pace.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-900/50" />
            <Input
              placeholder="Search by title, author, or category..."
              className="pl-10 bg-white/95 text-gray-900 border-0 h-11 placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category Cards */}
      {activeCats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all hover:shadow-md ${
                selectedCategory === "all"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-primary/30"
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs font-medium">All Books</span>
              <span className="text-xs text-muted-foreground">{totalBooks}</span>
            </button>
            {activeCats.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all hover:shadow-md ${
                  selectedCategory === cat
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-gray-200 hover:border-primary/30"
                }`}
              >
                {CATEGORY_ICONS[cat] || <BookOpen className="h-5 w-5" />}
                <span className="text-xs font-medium leading-tight">{cat}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "book" : "books"} found
        </p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="title">A - Z</SelectItem>
            <SelectItem value="downloads">Most Downloaded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Book Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="text-lg font-medium">No books found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or category filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((book) => (
            <Card
              key={book.id}
              className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer"
              onClick={() => setSelectedBook(book)}
            >
              {/* Cover */}
              <div className="aspect-[3/4] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center overflow-hidden relative">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <BookOpen className="h-12 w-12 text-amber-400" />
                    <p className="text-xs font-medium text-amber-700 line-clamp-2">
                      {book.title}
                    </p>
                  </div>
                )}
                {/* File type badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getFileTypeBadge(book.fileType)}`}
                  >
                    {book.fileType}
                  </span>
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {book.author}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${CATEGORY_COLORS[book.category] || ""}`}
                  >
                    {book.category.length > 20
                      ? book.category.substring(0, 18) + "..."
                      : book.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {book.downloadCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Book Detail Dialog */}
      <Dialog
        open={!!selectedBook}
        onOpenChange={(open) => !open && setSelectedBook(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedBook.title}
                </DialogTitle>
                <DialogDescription>
                  by {selectedBook.author}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 sm:grid-cols-[200px_1fr] mt-4">
                {/* Cover */}
                <div className="aspect-[3/4] bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedBook.coverImageUrl ? (
                    <img
                      src={selectedBook.coverImageUrl}
                      alt={selectedBook.title}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-amber-400" />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  {selectedBook.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedBook.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="outline">
                        {selectedBook.category}
                      </Badge>
                    </div>
                    {selectedBook.publisher && (
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Publisher</span>
                        <span>{selectedBook.publisher}</span>
                      </div>
                    )}
                    {selectedBook.publicationYear && (
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Year</span>
                        <span>{selectedBook.publicationYear}</span>
                      </div>
                    )}
                    {selectedBook.isbn && (
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">ISBN</span>
                        <span>{selectedBook.isbn}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Language</span>
                      <span>{selectedBook.language}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Format</span>
                      <span className="uppercase font-medium">
                        {selectedBook.fileType}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">File Size</span>
                      <span>{formatFileSize(selectedBook.fileSize)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Downloads</span>
                      <span>{selectedBook.downloadCount}</span>
                    </div>
                  </div>

                  {selectedBook.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedBook.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleDownload(selectedBook)}
                      disabled={downloading === selectedBook.id}
                    >
                      {downloading === selectedBook.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      )}
                    </Button>
                    {selectedBook.fileType === "pdf" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(selectedBook.fileUrl, "_blank")
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Read Online
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
