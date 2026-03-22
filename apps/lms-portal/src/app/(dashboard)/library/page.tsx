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
  const books = await prisma.libraryBook.findMany({
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
