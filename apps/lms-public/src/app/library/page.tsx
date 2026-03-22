import { Metadata } from "next";
import { prisma } from "@repo/db";
import { PublicLibrary } from "./public-library";

export const metadata: Metadata = {
  title: "Digital Theological Library",
  description:
    "Browse our curated collection of theological books, commentaries, and resources. Access hundreds of titles spanning Biblical studies, theology, church history, and more.",
};

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

export default async function PublicLibraryPage() {
  const books = await prisma.libraryBook.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      description: true,
      category: true,
      coverImageUrl: true,
      fileType: true,
      fileSize: true,
      downloadCount: true,
      publicationYear: true,
      publisher: true,
      createdAt: true,
    },
  });

  const categoryCounts: Record<string, number> = {};
  for (const book of books) {
    categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
  }

  const serialized = books.map((b) => ({
    ...b,
    fileSize: b.fileSize.toString(),
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <PublicLibrary
      books={serialized}
      categories={CATEGORIES}
      categoryCounts={categoryCounts}
      totalBooks={serialized.length}
    />
  );
}
