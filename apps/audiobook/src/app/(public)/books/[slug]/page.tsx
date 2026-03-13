import { Badge, Card, CardContent, CardHeader, CardTitle, Separator, Avatar, AvatarFallback, AvatarImage } from "@repo/ui";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@repo/db";
import { formatPrice, formatDuration } from "@/lib/utils";




import { BookActions } from "@/components/public/book-actions";

export const dynamic = 'force-dynamic';

// ─── Data Fetching ──────────────────────────────────────────────────────────

async function getBook(slug: string) {
  const book = await prisma.book.findUnique({
    where: { slug, status: "published" },
    include: {
      author: {
        include: {
          user: {
            select: { fullName: true, avatarUrl: true },
          },
        },
      },
      audioFiles: {
        orderBy: { sortOrder: "asc" },
      },
      ebookFiles: true,
      reviews: {
        where: { isVisible: true },
        include: {
          user: {
            select: { fullName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  return book;
}

async function getMoreByAuthor(authorId: string, currentBookId: string) {
  return prisma.book.findMany({
    where: {
      authorId,
      status: "published",
      id: { not: currentBookId },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        include: {
          user: { select: { fullName: true } },
        },
      },
    },
  });
}

// ─── SEO Metadata ───────────────────────────────────────────────────────────

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    return { title: "Book Not Found" };
  }

  const authorName = book.author.penName || book.author.user.fullName || "Unknown Author";

  return {
    title: `${book.title} by ${authorName}`,
    description: book.shortDescription || book.description?.slice(0, 160) || `Listen to ${book.title} on our audiobook platform.`,
    openGraph: {
      title: book.title,
      description: book.shortDescription || book.description?.slice(0, 160) || undefined,
      type: "book",
      ...(book.coverImageUrl && { images: [{ url: book.coverImageUrl }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description: book.shortDescription || book.description?.slice(0, 160) || undefined,
    },
  };
}

// ─── Helper Components ──────────────────────────────────────────────────────

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const fillPercent = Math.min(Math.max(rating - i, 0), 1) * 100;
        return (
          <div key={i} className={`relative ${sizeClass}`}>
            {/* Empty star */}
            <svg
              className={`${sizeClass} text-muted-foreground/30`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {/* Filled star overlay */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
              <svg
                className={`${sizeClass} text-amber-400`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BookTypeIcon({ bookType }: { bookType: string }) {
  if (bookType === "audiobook" || bookType === "both") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function formatFileSize(bytes: bigint | number): string {
  const b = Number(bytes);
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB`;
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    notFound();
  }

  const authorName = book.author.penName || book.author.user.fullName || "Unknown Author";
  const moreBooks = await getMoreByAuthor(book.authorId, book.id);

  const totalDuration = book.audioFiles.reduce((sum, f) => sum + f.durationSeconds, 0);
  const totalAudioSize = book.audioFiles.reduce((sum, f) => sum + Number(f.fileSizeBytes), 0);
  const hasDiscount = book.discountPrice !== null && book.discountPrice < book.price;
  const displayPrice = hasDiscount ? book.discountPrice! : book.price;
  const ratingAvg = Number(book.ratingAverage);

  return (
    <main className="min-h-screen bg-background">
      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[340px_1fr_300px]">
            {/* Cover Image */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative aspect-[2/3] w-full max-w-[340px] overflow-hidden rounded-xl shadow-2xl">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={`Cover of ${book.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40">
                    <div className="text-center text-primary-foreground">
                      <svg
                        className="mx-auto h-20 w-20 opacity-60"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                      <p className="mt-3 text-lg font-semibold opacity-80">{book.title}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Book Info */}
            <div className="flex flex-col gap-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <BookTypeIcon bookType={book.bookType} />
                  {book.bookType === "both"
                    ? "Audiobook & Ebook"
                    : book.bookType === "audiobook"
                    ? "Audiobook"
                    : "Ebook"}
                </Badge>
                {book.genre && <Badge variant="outline">{book.genre}</Badge>}
                {book.subGenre && <Badge variant="outline">{book.subGenre}</Badge>}
                {book.isFree && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700">Free</Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {book.title}
              </h1>

              {/* Author */}
              <p className="text-lg text-muted-foreground">
                by{" "}
                <Link
                  href={`/authors/${book.author.id}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {authorName}
                </Link>
              </p>

              {/* Rating */}
              {book.ratingCount > 0 && (
                <div className="flex items-center gap-3">
                  <StarRating rating={ratingAvg} size="md" />
                  <span className="text-lg font-semibold">{ratingAvg.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({book.ratingCount} {book.ratingCount === 1 ? "rating" : "ratings"})
                  </span>
                </div>
              )}

              {/* Short Description */}
              {book.shortDescription && (
                <p className="max-w-2xl text-muted-foreground">{book.shortDescription}</p>
              )}

              {/* Audio summary */}
              {book.audioFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDuration(totalDuration)} total
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                    </svg>
                    {book.audioFiles.length} {book.audioFiles.length === 1 ? "chapter" : "chapters"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {formatFileSize(totalAudioSize)}
                  </span>
                </div>
              )}

              {/* Price & Actions */}
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {book.isFree ? (
                  <span className="text-2xl font-bold text-emerald-600">Free</span>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{formatPrice(displayPrice)}</span>
                    {hasDiscount && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(book.price)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <BookActions
                bookId={book.id}
                bookSlug={book.slug}
                title={book.title}
                coverImageUrl={book.coverImageUrl}
                bookType={book.bookType}
                price={displayPrice}
                isFree={book.isFree}
                authorName={authorName}
              />
            </div>

            {/* Sidebar — Book Details */}
            <div className="lg:mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Book Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <DetailRow label="Language" value={book.language} />
                  {book.publicationDate && (
                    <DetailRow
                      label="Published"
                      value={new Date(book.publicationDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    />
                  )}
                  {book.pageCount && (
                    <DetailRow label="Pages" value={`${book.pageCount}`} />
                  )}
                  {book.isbn && <DetailRow label="ISBN" value={book.isbn} />}
                  <DetailRow
                    label="Format"
                    value={
                      book.bookType === "both"
                        ? "Audiobook & Ebook"
                        : book.bookType === "audiobook"
                        ? "Audiobook"
                        : "Ebook"
                    }
                  />
                  {book.audioFiles.length > 0 && (
                    <>
                      <DetailRow label="Audio Chapters" value={`${book.audioFiles.length}`} />
                      <DetailRow label="Total Duration" value={formatDuration(totalDuration)} />
                    </>
                  )}
                  {book.ebookFiles.length > 0 && (
                    <DetailRow
                      label="Ebook Files"
                      value={book.ebookFiles.map((f) => f.format.toUpperCase()).join(", ")}
                    />
                  )}
                  <DetailRow label="Downloads" value={`${book.downloadCount.toLocaleString()}`} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body Content ─────────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="space-y-10">
            {/* Description */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">About This Book</h2>
              <div className="prose prose-neutral max-w-none dark:prose-invert">
                {book.description ? (
                  book.description.split("\n").map((paragraph, i) => (
                    <p key={i} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-muted-foreground">No description available.</p>
                )}
              </div>
            </section>

            <Separator />

            {/* Chapter List */}
            {book.audioFiles.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">Chapters</h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {book.audioFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-6"
                        >
                          <div className="flex items-center gap-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                              {file.chapterNumber}
                            </span>
                            <div>
                              <p className="font-medium">
                                {file.chapterTitle || `Chapter ${file.chapterNumber}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.fileSizeBytes)} &middot; {file.format.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {formatDuration(file.durationSeconds)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Total row */}
                    <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3 sm:px-6">
                      <span className="text-sm font-semibold">
                        {book.audioFiles.length} {book.audioFiles.length === 1 ? "chapter" : "chapters"}
                      </span>
                      <span className="text-sm font-semibold">
                        Total: {formatDuration(totalDuration)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {book.audioFiles.length > 0 && <Separator />}

            {/* Reviews */}
            <section>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold">Reviews</h2>
                {book.ratingCount > 0 && (
                  <div className="flex items-center gap-3">
                    <StarRating rating={ratingAvg} size="lg" />
                    <span className="text-2xl font-bold">{ratingAvg.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      based on {book.ratingCount} {book.ratingCount === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                )}
              </div>

              {/* Rating Distribution */}
              {book.ratingCount > 0 && (
                <RatingDistribution reviews={book.reviews} totalCount={book.ratingCount} />
              )}

              {/* Review List */}
              {book.reviews.length > 0 ? (
                <div className="mt-6 space-y-6">
                  {book.reviews.map((review) => (
                    <div key={review.id} className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        {review.user.avatarUrl && (
                          <AvatarImage src={review.user.avatarUrl} alt={review.user.fullName || "User"} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(review.user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {review.user.fullName || "Anonymous"}
                          </span>
                          {review.isVerifiedPurchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="mt-1">
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.reviewText && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {review.reviewText}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="mt-4">
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <svg
                      className="mb-3 h-12 w-12 text-muted-foreground/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                      />
                    </svg>
                    <p className="font-medium">No reviews yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Be the first to share your thoughts on this book.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          {/* Right sidebar spacer for alignment on desktop */}
          <div className="hidden lg:block" />
        </div>

        {/* ── More by This Author ──────────────────────────────────────────── */}
        {moreBooks.length > 0 && (
          <>
            <Separator className="my-10" />
            <section>
              <h2 className="mb-6 text-2xl font-bold">More by {authorName}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {moreBooks.map((b) => {
                  const bAuthorName =
                    b.author.penName || b.author.user.fullName || "Unknown Author";
                  const bHasDiscount =
                    b.discountPrice !== null && b.discountPrice < b.price;
                  const bDisplayPrice = bHasDiscount ? b.discountPrice! : b.price;

                  return (
                    <Link key={b.id} href={`/books/${b.slug}`} className="group">
                      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {b.coverImageUrl ? (
                            <img
                              src={b.coverImageUrl}
                              alt={`Cover of ${b.title}`}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/70 via-primary/50 to-primary/30">
                              <svg
                                className="h-14 w-14 text-primary-foreground/60"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="line-clamp-1 font-semibold group-hover:underline">
                            {b.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">{bAuthorName}</p>
                          <div className="mt-2 flex items-center justify-between">
                            {b.isFree ? (
                              <span className="text-sm font-semibold text-emerald-600">Free</span>
                            ) : (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-semibold">
                                  {formatPrice(bDisplayPrice)}
                                </span>
                                {bHasDiscount && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    {formatPrice(b.price)}
                                  </span>
                                )}
                              </div>
                            )}
                            {Number(b.ratingAverage) > 0 && (
                              <div className="flex items-center gap-1">
                                <svg
                                  className="h-3.5 w-3.5 text-amber-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-xs text-muted-foreground">
                                  {Number(b.ratingAverage).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function RatingDistribution({
  reviews,
  totalCount,
}: {
  reviews: { rating: number }[];
  totalCount: number;
}) {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      counts[r.rating - 1]++;
    }
  });

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star - 1];
        const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-6 text-right font-medium">{star}</span>
            <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
