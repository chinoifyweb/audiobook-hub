import { prisma } from "@repo/db";
import { LibraryBrowser } from "./library-browser";

export const dynamic = "force-dynamic";

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

export default async function StudentLibraryPage() {
  let books: Array<{
    id: string;
    title: string;
    author: string;
    description: string | null;
    category: string;
    subcategory: string | null;
    coverImageUrl: string | null;
    fileUrl: string;
    fileType: string;
    fileSize: bigint;
    publisher: string | null;
    publicationYear: number | null;
    language: string;
    tags: string[];
    downloadCount: number;
    isPublic: boolean;
    isbn: string | null;
    createdAt: Date;
  }> = [];

  try {
    books = await prisma.libraryBook.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        category: true,
        subcategory: true,
        coverImageUrl: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        publisher: true,
        publicationYear: true,
        language: true,
        tags: true,
        downloadCount: true,
        isPublic: true,
        isbn: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch library books:", error);
    // Return empty library instead of crashing
  }

  // Get category counts
  const categoryCounts: Record<string, number> = {};
  for (const book of books) {
    categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
  }

  const serializedBooks = books.map((b) => ({
    ...b,
    fileSize: b.fileSize.toString(),
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <LibraryBrowser
      books={serializedBooks}
      categories={CATEGORIES}
      categoryCounts={categoryCounts}
      totalBooks={books.length}
    />
  );
}
