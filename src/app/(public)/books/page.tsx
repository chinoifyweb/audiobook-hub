import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { BookType, Prisma } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Headphones,
  Star,
  BookMarked,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BookCatalogFilters } from "./filters";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Browse Books | Audiobook Marketplace",
  description:
    "Discover thousands of audiobooks and ebooks. Filter by genre, format, price, and more.",
};

const BOOKS_PER_PAGE = 12;

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Science Fiction",
  "Fantasy",
  "Biography",
  "Self-Help",
  "Business",
  "History",
  "Children",
  "Young Adult",
  "Horror",
  "Poetry",
  "Religion",
  "Technology",
  "Health",
] as const;

type SortOption = "newest" | "popular" | "price_asc" | "price_desc" | "top_rated";

interface SearchParams {
  q?: string;
  genre?: string;
  type?: string;
  price_min?: string;
  price_max?: string;
  sort?: string;
  page?: string;
}

function getOrderBy(sort: SortOption): Prisma.BookOrderByWithRelationInput {
  switch (sort) {
    case "popular":
      return { downloadCount: "desc" };
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "top_rated":
      return { ratingAverage: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

function buildWhereClause(searchParams: SearchParams): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = {
    status: "published",
  };

  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: "insensitive" } },
      { description: { contains: searchParams.q, mode: "insensitive" } },
      {
        author: {
          penName: { contains: searchParams.q, mode: "insensitive" },
        },
      },
    ];
  }

  if (searchParams.genre) {
    where.genre = searchParams.genre;
  }

  if (searchParams.type && ["ebook", "audiobook", "both"].includes(searchParams.type)) {
    where.bookType = searchParams.type as BookType;
  }

  if (searchParams.price_min || searchParams.price_max) {
    where.price = {};
    if (searchParams.price_min) {
      const minKobo = parseInt(searchParams.price_min, 10) * 100;
      if (!isNaN(minKobo)) {
        where.price.gte = minKobo;
      }
    }
    if (searchParams.price_max) {
      const maxKobo = parseInt(searchParams.price_max, 10) * 100;
      if (!isNaN(maxKobo)) {
        where.price.lte = maxKobo;
      }
    }
  }

  return where;
}

export default async function BookCatalogPage({
  searchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  // Handle both sync and async searchParams (Next.js 14 compatibility)
  const params = typeof searchParams === 'object' && 'then' in searchParams
    ? await searchParams
    : searchParams as SearchParams;
  const page = Math.max(1, parseInt(params?.page ?? "1", 10) || 1);
  const sort = (params?.sort ?? "newest") as SortOption;

  type BookWithAuthor = Awaited<ReturnType<typeof prisma.book.findMany>>[number] & {
    author: { id: string; penName: string | null };
  };
  let books: BookWithAuthor[] = [];
  let totalCount = 0;

  try {
    const where = buildWhereClause(params ?? {});
    const orderBy = getOrderBy(sort);

    const result = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy,
        skip: (page - 1) * BOOKS_PER_PAGE,
        take: BOOKS_PER_PAGE,
        include: {
          author: {
            select: {
              id: true,
              penName: true,
            },
          },
        },
      }),
      prisma.book.count({ where }),
    ]);
    books = result[0] as BookWithAuthor[];
    totalCount = result[1];
  } catch (error) {
    console.error("Error fetching books:", error);
  }

  const totalPages = Math.ceil(totalCount / BOOKS_PER_PAGE);

  // Build base URL params for pagination links
  function buildPageUrl(pageNum: number): string {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.genre) p.set("genre", params.genre);
    if (params.type) p.set("type", params.type);
    if (params.price_min) p.set("price_min", params.price_min);
    if (params.price_max) p.set("price_max", params.price_max);
    if (params.sort) p.set("sort", params.sort);
    if (pageNum > 1) p.set("page", String(pageNum));
    const qs = p.toString();
    return `/books${qs ? `?${qs}` : ""}`;
  }

  // Generate visible page numbers
  function getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  const activeFilterCount = [
    params.genre,
    params.type,
    params.price_min,
    params.price_max,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b bg-muted/30">
        <div className="container py-8 md:py-12">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Browse Books
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover your next great listen or read from our catalog of{" "}
            {totalCount.toLocaleString()} titles
          </p>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        {/* Filters */}
        <BookCatalogFilters
          genres={GENRES as unknown as string[]}
          currentSearch={params.q}
          currentGenre={params.genre}
          currentType={params.type}
          currentSort={sort}
          currentPriceMin={params.price_min}
          currentPriceMax={params.price_max}
          activeFilterCount={activeFilterCount}
        />

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "No books found"
              : `Showing ${(page - 1) * BOOKS_PER_PAGE + 1}–${Math.min(
                  page * BOOKS_PER_PAGE,
                  totalCount
                )} of ${totalCount.toLocaleString()} books`}
          </p>
        </div>

        {/* Book Grid */}
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
            <BookMarked className="h-16 w-16 text-muted-foreground/40" />
            <h2 className="mt-4 text-xl font-semibold">No books found</h2>
            <p className="mt-2 max-w-md text-center text-muted-foreground">
              We could not find any books matching your search criteria. Try
              adjusting your filters or search term.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/books">Clear all filters</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.slug}`}>
                <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
                  {/* Cover Image */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        {book.bookType === "audiobook" ? (
                          <Headphones className="h-12 w-12 text-primary/30" />
                        ) : (
                          <BookOpen className="h-12 w-12 text-primary/30" />
                        )}
                      </div>
                    )}
                    {/* Book Type Badge */}
                    <div className="absolute left-2 top-2">
                      <Badge
                        variant="secondary"
                        className="bg-background/90 backdrop-blur-sm text-xs"
                      >
                        {book.bookType === "audiobook" && (
                          <>
                            <Headphones className="mr-1 h-3 w-3" />
                            Audio
                          </>
                        )}
                        {book.bookType === "ebook" && (
                          <>
                            <BookOpen className="mr-1 h-3 w-3" />
                            Ebook
                          </>
                        )}
                        {book.bookType === "both" && (
                          <>
                            <BookOpen className="mr-1 h-3 w-3" />
                            Both
                          </>
                        )}
                      </Badge>
                    </div>
                    {/* Featured tag */}
                    {book.isFeatured && (
                      <div className="absolute right-2 top-2">
                        <Badge className="bg-amber-500 text-white hover:bg-amber-500 text-xs">
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3 md:p-4">
                    {/* Title */}
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight group-hover:text-primary md:text-base">
                      {book.title}
                    </h3>

                    {/* Author */}
                    <p className="mt-1 truncate text-xs text-muted-foreground md:text-sm">
                      {book.author.penName ?? "Unknown Author"}
                    </p>

                    {/* Rating */}
                    {book.ratingCount > 0 && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-medium">
                          {Number(book.ratingAverage).toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({book.ratingCount.toLocaleString()})
                        </span>
                      </div>
                    )}

                    {/* Genre */}
                    {book.genre && (
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">
                        {book.genre}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-2">
                      {book.isFree ? (
                        <span className="text-sm font-bold text-green-600">
                          Free
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          {book.discountPrice ? (
                            <>
                              <span className="text-sm font-bold">
                                {formatPrice(book.discountPrice)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(book.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold">
                              {formatPrice(book.price)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="mt-8 flex items-center justify-center gap-1"
            aria-label="Pagination"
          >
            <Button
              variant="outline"
              size="icon"
              asChild={page > 1}
              disabled={page <= 1}
              className="h-9 w-9"
            >
              {page > 1 ? (
                <Link href={buildPageUrl(page - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="h-4 w-4" />
                </span>
              )}
            </Button>

            {getPageNumbers()[0] > 1 && (
              <>
                <Button variant="outline" size="icon" asChild className="h-9 w-9">
                  <Link href={buildPageUrl(1)}>1</Link>
                </Button>
                {getPageNumbers()[0] > 2 && (
                  <span className="px-1 text-muted-foreground">...</span>
                )}
              </>
            )}

            {getPageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="icon"
                asChild={pageNum !== page}
                className="h-9 w-9"
              >
                {pageNum === page ? (
                  <span>{pageNum}</span>
                ) : (
                  <Link href={buildPageUrl(pageNum)}>{pageNum}</Link>
                )}
              </Button>
            ))}

            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <>
                {getPageNumbers()[getPageNumbers().length - 1] <
                  totalPages - 1 && (
                  <span className="px-1 text-muted-foreground">...</span>
                )}
                <Button variant="outline" size="icon" asChild className="h-9 w-9">
                  <Link href={buildPageUrl(totalPages)}>{totalPages}</Link>
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              asChild={page < totalPages}
              disabled={page >= totalPages}
              className="h-9 w-9"
            >
              {page < totalPages ? (
                <Link href={buildPageUrl(page + 1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span>
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
