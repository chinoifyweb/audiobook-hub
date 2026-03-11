"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Headphones,
  BookOpen,
  Play,
  Library as LibraryIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDuration } from "@/lib/utils";

export interface LibraryBook {
  id: string;
  bookId: string;
  accessType: "purchased" | "subscription";
  listeningProgress: {
    chapter?: number;
    position_seconds?: number;
  } | null;
  readingProgress: {
    page?: number;
    percentage?: number;
  } | null;
  book: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string | null;
    bookType: "ebook" | "audiobook" | "both";
    genre: string | null;
    author: {
      penName: string | null;
      user: {
        fullName: string | null;
      };
    };
    audioFiles: {
      id: string;
      durationSeconds: number;
    }[];
  };
}

interface LibraryContentProps {
  books: LibraryBook[];
}

function getProgress(item: LibraryBook): number {
  const { book, listeningProgress, readingProgress } = item;

  if (
    (book.bookType === "audiobook" || book.bookType === "both") &&
    listeningProgress?.position_seconds != null
  ) {
    const totalDuration = book.audioFiles.reduce(
      (sum, f) => sum + f.durationSeconds,
      0
    );
    if (totalDuration === 0) return 0;

    const currentChapter = listeningProgress.chapter ?? 0;
    const completedDuration = book.audioFiles
      .filter((_, i) => i < currentChapter)
      .reduce((sum, f) => sum + f.durationSeconds, 0);

    return Math.min(
      100,
      Math.round(
        ((completedDuration + (listeningProgress.position_seconds || 0)) /
          totalDuration) *
          100
      )
    );
  }

  if (readingProgress?.percentage != null) {
    return Math.round(readingProgress.percentage * 100);
  }

  return 0;
}

function isInProgress(item: LibraryBook): boolean {
  const progress = getProgress(item);
  return progress > 0 && progress < 100;
}

function isCompleted(item: LibraryBook): boolean {
  return getProgress(item) >= 100;
}

function getTotalDuration(audioFiles: { durationSeconds: number }[]): string {
  const total = audioFiles.reduce((sum, f) => sum + f.durationSeconds, 0);
  return formatDuration(total);
}

function BookCard({ item }: { item: LibraryBook }) {
  const { book } = item;
  const progress = getProgress(item);
  const authorName = book.author.penName || book.author.user.fullName || "Unknown Author";
  const isAudio = book.bookType === "audiobook" || book.bookType === "both";

  const playerUrl = isAudio
    ? `/dashboard/player/${book.id}`
    : `/dashboard/reader/${book.id}`;

  let buttonLabel = "Start";
  if (progress >= 100) {
    buttonLabel = isAudio ? "Listen Again" : "Read Again";
  } else if (progress > 0) {
    buttonLabel = isAudio ? "Continue Listening" : "Continue Reading";
  } else {
    buttonLabel = isAudio ? "Start Listening" : "Start Reading";
  }

  // Gradient backgrounds for books without covers
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-yellow-600",
  ];
  const gradientIndex =
    book.title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    gradients.length;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      {/* Cover */}
      <div
        className={`relative aspect-[3/4] bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center`}
      >
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/80">
            {isAudio ? (
              <Headphones className="h-10 w-10" />
            ) : (
              <BookOpen className="h-10 w-10" />
            )}
            <span className="px-4 text-center text-xs font-medium">
              {book.title}
            </span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute right-2 top-2">
          <Badge
            variant="secondary"
            className="bg-black/60 text-white backdrop-blur-sm"
          >
            {book.bookType === "both"
              ? "Audio + Ebook"
              : book.bookType === "audiobook"
                ? "Audiobook"
                : "Ebook"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title & author */}
        <h3 className="truncate text-sm font-semibold">{book.title}</h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {authorName}
        </p>

        {/* Duration / genre */}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {isAudio && book.audioFiles.length > 0 && (
            <span>{getTotalDuration(book.audioFiles)}</span>
          )}
          {book.genre && (
            <>
              {isAudio && book.audioFiles.length > 0 && <span>·</span>}
              <span>{book.genre}</span>
            </>
          )}
        </div>

        {/* Progress */}
        {progress > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Action button */}
        <Button asChild size="sm" className="mt-3 w-full gap-2" variant={progress > 0 ? "default" : "outline"}>
          <Link href={playerUrl}>
            <Play className="h-3.5 w-3.5" />
            {buttonLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyLibrary() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <LibraryIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Your library is empty</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Browse our catalog to find your next great listen or read. Purchase books
        or subscribe for unlimited access.
      </p>
      <Button asChild className="mt-6">
        <Link href="/books">Browse Books</Link>
      </Button>
    </div>
  );
}

export function LibraryContent({ books }: LibraryContentProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(
      (item) =>
        item.book.title.toLowerCase().includes(q) ||
        (item.book.author.penName || item.book.author.user.fullName || "")
          .toLowerCase()
          .includes(q) ||
        (item.book.genre || "").toLowerCase().includes(q)
    );
  }, [books, search]);

  const audiobooks = useMemo(
    () =>
      filtered.filter(
        (b) => b.book.bookType === "audiobook" || b.book.bookType === "both"
      ),
    [filtered]
  );
  const ebooks = useMemo(
    () =>
      filtered.filter(
        (b) => b.book.bookType === "ebook" || b.book.bookType === "both"
      ),
    [filtered]
  );
  const inProgress = useMemo(
    () => filtered.filter((b) => isInProgress(b)),
    [filtered]
  );
  const completed = useMemo(
    () => filtered.filter((b) => isCompleted(b)),
    [filtered]
  );

  if (books.length === 0) {
    return <EmptyLibrary />;
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search your library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            All ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="audiobooks">
            Audiobooks ({audiobooks.length})
          </TabsTrigger>
          <TabsTrigger value="ebooks">
            Ebooks ({ebooks.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <BookGrid items={filtered} />
        </TabsContent>
        <TabsContent value="audiobooks">
          <BookGrid items={audiobooks} />
        </TabsContent>
        <TabsContent value="ebooks">
          <BookGrid items={ebooks} />
        </TabsContent>
        <TabsContent value="in-progress">
          <BookGrid items={inProgress} />
        </TabsContent>
        <TabsContent value="completed">
          <BookGrid items={completed} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookGrid({ items }: { items: LibraryBook[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No books found in this category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <BookCard key={item.id} item={item} />
      ))}
    </div>
  );
}
