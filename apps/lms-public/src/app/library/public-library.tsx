"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
} from "@repo/ui";
import {
  BookOpen,
  Download,
  Search,
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
  ArrowUpDown,
  Sparkles,
  LogIn,
} from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.bba.org.ng";

interface PublicBook {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string;
  coverImageUrl: string | null;
  fileType: string;
  fileSize: string;
  downloadCount: number;
  publicationYear: number | null;
  publisher: string | null;
  createdAt: string;
}

interface PublicLibraryProps {
  books: PublicBook[];
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
  "Biblical Studies": "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  "Systematic Theology": "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  "Church History": "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  "Pastoral Ministry": "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  "Missions & Evangelism": "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  "Christian Education": "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
  "Counselling & Psychology": "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
  "Leadership & Administration": "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  "Marriage & Family": "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  "Devotional & Spiritual Formation": "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  "Biblical Languages (Greek/Hebrew)": "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
  "Ethics & Philosophy": "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
  "African Theology": "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  "Digital Ministry & Technology": "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
  "Reference & Dictionaries": "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
};

function getFileTypeBadge(type: string) {
  const colors: Record<string, string> = {
    pdf: "bg-red-100 text-red-700",
    epub: "bg-green-100 text-green-700",
    docx: "bg-blue-100 text-blue-700",
  };
  return colors[type.toLowerCase()] || "bg-gray-100 text-gray-700";
}

export function PublicLibrary({
  books,
  categories,
  categoryCounts,
  totalBooks,
}: PublicLibraryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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

  const activeCats = categories.filter((cat) => (categoryCounts[cat] || 0) > 0);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU2IDAgMy0xLjM0NCAzLTNzLTEuMzQ0LTMtMy0zLTMgMS4zNDQtMyAzIDEuMzQ0IDMgMyAzem0wIDZjMS42NTYgMCAzLTEuMzQ0IDMtM3MtMS4zNDQtMy0zLTMtMyAxLjM0NC0zIDMgMS4zNDQgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-amber-200">
              <BookMarked className="h-4 w-4" />
              Berean Bible Academy
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Digital Theological Library
            </h1>
            <p className="text-lg text-amber-200 mb-8 max-w-2xl mx-auto">
              Access our curated collection of {totalBooks}+ theological resources spanning
              Biblical studies, systematic theology, church history, and more.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search books by title, author, or topic..."
                className="pl-11 h-12 bg-white text-gray-900 border-0 rounded-lg shadow-lg placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10 space-y-10">
        {/* Categories Grid */}
        {activeCats.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:shadow-md ${
                  selectedCategory === "all"
                    ? "border-amber-500 bg-amber-50 shadow-md"
                    : "border-gray-200 hover:border-amber-300"
                }`}
              >
                <BookOpen className="h-6 w-6 text-amber-700" />
                <span className="text-xs font-semibold">All Books</span>
                <span className="text-xs text-muted-foreground">{totalBooks}</span>
              </button>
              {activeCats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all hover:shadow-md ${
                    selectedCategory === cat
                      ? "border-amber-500 bg-amber-50 shadow-md"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <span className="text-amber-700">
                    {CATEGORY_ICONS[cat] || <BookOpen className="h-6 w-6" />}
                  </span>
                  <span className="text-xs font-semibold leading-tight">{cat}</span>
                  <span className="text-xs text-muted-foreground">
                    {categoryCounts[cat]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Sort + Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {totalBooks} books
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="title">A - Z</SelectItem>
              <SelectItem value="downloads">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Book Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">No books found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or browse a different category.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((book) => (
              <Card
                key={book.id}
                className="group overflow-hidden transition-all hover:shadow-xl border-0 shadow-md"
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
                    <div className="flex flex-col items-center gap-3 p-4 text-center">
                      <BookOpen className="h-12 w-12 text-amber-300" />
                      <p className="text-xs font-medium text-amber-600 line-clamp-3">
                        {book.title}
                      </p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shadow-sm ${getFileTypeBadge(book.fileType)}`}
                    >
                      {book.fileType}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    by {book.author}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${CATEGORY_COLORS[book.category] || ""}`}
                  >
                    {book.category.length > 22
                      ? book.category.substring(0, 20) + "..."
                      : book.category}
                  </Badge>
                  <div className="pt-2">
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      asChild
                    >
                      <Link href={`${PORTAL_URL}/login`}>
                        <LogIn className="mr-1.5 h-3.5 w-3.5" />
                        Login to Download
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <section className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-8 md:p-12 text-center">
          <BookMarked className="mx-auto mb-4 h-10 w-10 text-amber-600" />
          <h2 className="text-2xl font-bold mb-3">
            Access the Full Library
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join Berean Bible Academy to access our complete library of {totalBooks}+
            theological resources. Download books, track your reading, and grow in
            your knowledge of God&apos;s Word.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href={`${PORTAL_URL}/signup`}>Apply to BBA</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={`${PORTAL_URL}/login`}>Student Login</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
