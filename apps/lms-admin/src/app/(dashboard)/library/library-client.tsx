"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  FolderOpen,
  Upload,
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  File,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";

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
  isbn: string | null;
  publisher: string | null;
  publicationYear: number | null;
  language: string;
  tags: string[];
  downloadCount: number;
  isPublic: boolean;
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  uploader: { fullName: string | null; email: string };
}

interface LibraryClientProps {
  books: LibraryBook[];
  totalBooks: number;
  totalDownloads: number;
  categoryCount: number;
  recentUploads: number;
}

function formatFileSize(bytes: string): string {
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileText className="h-4 w-4 text-red-500" />;
    case "epub":
      return <BookOpen className="h-4 w-4 text-green-500" />;
    case "docx":
      return <File className="h-4 w-4 text-blue-500" />;
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
}

export function LibraryClient({
  books,
  totalBooks,
  totalDownloads,
  categoryCount,
  recentUploads,
}: LibraryClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        !search ||
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || book.category === categoryFilter;
      const matchesFileType =
        fileTypeFilter === "all" ||
        book.fileType.toLowerCase() === fileTypeFilter;
      return matchesSearch && matchesCategory && matchesFileType;
    });
  }, [books, search, categoryFilter, fileTypeFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this book?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete book");
      }
    } catch {
      alert("Failed to delete book");
    } finally {
      setDeleting(null);
    }
  }

  const stats = [
    {
      label: "Total Books",
      value: totalBooks,
      icon: BookOpen,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Total Downloads",
      value: totalDownloads,
      icon: Download,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Categories",
      value: categoryCount,
      icon: FolderOpen,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Recent Uploads",
      value: recentUploads,
      icon: Clock,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-Library</h1>
          <p className="text-muted-foreground">
            Manage the digital theological library
          </p>
        </div>
        <Button asChild>
          <Link href="/library/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or author..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="epub">EPUB</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Books ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No books found</h3>
              <p className="text-muted-foreground">
                {books.length === 0
                  ? "Get started by adding your first book to the library."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Book
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground hidden md:table-cell">
                      Category
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground hidden sm:table-cell">
                      Type
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground hidden lg:table-cell">
                      Size
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground hidden sm:table-cell">
                      Downloads
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground hidden lg:table-cell">
                      Access
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((book) => (
                    <tr key={book.id} className="hover:bg-muted/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-muted flex items-center justify-center">
                            {book.coverImageUrl ? (
                              <img
                                src={book.coverImageUrl}
                                alt={book.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">
                              {book.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {book.author}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {book.category}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          {getFileIcon(book.fileType)}
                          <span className="uppercase text-xs font-medium">
                            {book.fileType}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell text-muted-foreground">
                        {formatFileSize(book.fileSize)}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{book.downloadCount}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        {book.isPublic ? (
                          <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                            <Eye className="mr-1 h-3 w-3" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="mr-1 h-3 w-3" />
                            Students Only
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <Link href={`/library/${book.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(book.id)}
                            disabled={deleting === book.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
