"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Moon,
  Sun,
  Type,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface BookData {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  authorName: string;
  pageCount: number;
  description: string;
  ebookFiles: {
    id: string;
    format: string;
    fileUrl: string;
  }[];
}

interface ReadingProgress {
  page: number;
  percentage: number;
}

type ReaderTheme = "light" | "dark" | "sepia";
type FontSize = "small" | "medium" | "large" | "xl";

const fontSizeMap: Record<FontSize, string> = {
  small: "text-sm leading-relaxed",
  medium: "text-base leading-relaxed",
  large: "text-lg leading-loose",
  xl: "text-xl leading-loose",
};

const fontSizeLabel: Record<FontSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
  xl: "XL",
};

const fontSizeOrder: FontSize[] = ["small", "medium", "large", "xl"];

const themeStyles: Record<ReaderTheme, { bg: string; text: string; card: string }> = {
  light: {
    bg: "bg-white",
    text: "text-gray-900",
    card: "bg-gray-50 border-gray-200",
  },
  dark: {
    bg: "bg-zinc-950",
    text: "text-zinc-100",
    card: "bg-zinc-900 border-zinc-800",
  },
  sepia: {
    bg: "bg-amber-50",
    text: "text-amber-950",
    card: "bg-amber-100/50 border-amber-200",
  },
};

export function EbookReader({
  book,
  initialProgress,
}: {
  book: BookData;
  initialProgress: ReadingProgress | null;
}) {
  const totalPages = book.pageCount || 100;
  const [currentPage, setCurrentPage] = useState(initialProgress?.page || 1);
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const percentage = Math.round((currentPage / totalPages) * 100);

  const saveProgress = useCallback(
    async (page: number) => {
      setIsSaving(true);
      try {
        await fetch("/api/user/reading-progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: book.id,
            page,
            percentage: Math.round((page / totalPages) * 100) / 100,
          }),
        });
      } catch {
        // Silently fail - progress saving is best-effort
      } finally {
        setIsSaving(false);
      }
    },
    [book.id, totalPages]
  );

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress(currentPage);
    }, 30000);
    return () => clearInterval(interval);
  }, [currentPage, saveProgress]);

  // Save on page change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveProgress(currentPage);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [currentPage, saveProgress]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const increaseFontSize = () => {
    const idx = fontSizeOrder.indexOf(fontSize);
    if (idx < fontSizeOrder.length - 1) {
      setFontSize(fontSizeOrder[idx + 1]);
    }
  };

  const decreaseFontSize = () => {
    const idx = fontSizeOrder.indexOf(fontSize);
    if (idx > 0) {
      setFontSize(fontSizeOrder[idx - 1]);
    }
  };

  const cycleTheme = () => {
    const themes: ReaderTheme[] = ["light", "dark", "sepia"];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const currentTheme = themeStyles[theme];

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-300`}>
      {/* Top toolbar */}
      {showControls && (
        <div
          className={`sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm ${currentTheme.card} transition-colors duration-300`}
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold line-clamp-1">
                  {book.title}
                </h1>
                <p className="text-xs opacity-60">{book.authorName}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Font size controls */}
              <Button
                variant="ghost"
                size="icon"
                onClick={decreaseFontSize}
                disabled={fontSize === "small"}
                title="Decrease font size"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-xs font-medium">
                {fontSizeLabel[fontSize]}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={increaseFontSize}
                disabled={fontSize === "xl"}
                title="Increase font size"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <div className="mx-1 h-6 w-px bg-current opacity-20" />

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={cycleTheme}
                title={`Theme: ${theme}`}
              >
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : theme === "sepia" ? (
                  <Type className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* Bookmark */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsBookmarked(!isBookmarked)}
                title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reader content area */}
      <div
        className="mx-auto max-w-3xl px-6 py-10 sm:px-10 md:px-16 min-h-[calc(100vh-140px)] cursor-pointer"
        onClick={() => setShowControls(!showControls)}
      >
        <div className={fontSizeMap[fontSize]}>
          {/* Placeholder content since we don't have epub rendering */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className={`mb-8 rounded-2xl border-2 border-dashed p-12 ${currentTheme.card}`}
            >
              <BookOpen className="mx-auto mb-6 h-16 w-16 opacity-40" />
              <h2 className="mb-3 text-2xl font-bold">{book.title}</h2>
              <p className="mb-2 opacity-60">by {book.authorName}</p>
              {book.description && (
                <p className="mx-auto mt-6 max-w-md opacity-70">
                  {book.description}
                </p>
              )}
            </div>

            <div className={`w-full max-w-md rounded-lg border p-6 ${currentTheme.card}`}>
              <p className="mb-4 text-sm font-medium opacity-70">
                Ebook Reader
              </p>
              <p className="text-sm opacity-50">
                Full ebook content will render here when epub/pdf rendering is
                integrated. Use the navigation controls below to simulate page
                turning.
              </p>
              <p className="mt-4 text-sm opacity-50">
                Available formats:{" "}
                {book.ebookFiles.map((f) => f.format.toUpperCase()).join(", ")}
              </p>
            </div>

            <p className="mt-8 text-sm opacity-40">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom navigation bar */}
      {showControls && (
        <div
          className={`sticky bottom-0 z-10 border-t px-4 py-3 backdrop-blur-sm ${currentTheme.card} transition-colors duration-300`}
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-2 flex items-center justify-between text-xs opacity-60">
              <span>Page {currentPage} of {totalPages}</span>
              <span>
                {percentage}% complete
                {isSaving && " - Saving..."}
              </span>
            </div>
            <Progress value={percentage} className="mb-3 h-1.5" />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= totalPages) {
                      setCurrentPage(val);
                    }
                  }}
                  className={`w-16 rounded border px-2 py-1 text-center text-sm ${currentTheme.card} ${currentTheme.text}`}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
