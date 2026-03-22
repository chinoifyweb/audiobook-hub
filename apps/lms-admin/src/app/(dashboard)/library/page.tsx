import { prisma } from "@repo/db";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [books, stats] = await Promise.all([
    prisma.libraryBook.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        uploader: { select: { fullName: true, email: true } },
      },
    }),
    prisma.libraryBook.aggregate({
      where: { isActive: true },
      _count: true,
      _sum: { downloadCount: true },
    }),
  ]);

  // Get unique categories count
  const categories = await prisma.libraryBook.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  // Recent uploads (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCount = await prisma.libraryBook.count({
    where: { isActive: true, createdAt: { gte: sevenDaysAgo } },
  });

  const serializedBooks = books.map((b) => ({
    ...b,
    fileSize: b.fileSize.toString(),
  }));

  return (
    <LibraryClient
      books={serializedBooks}
      totalBooks={stats._count}
      totalDownloads={stats._sum.downloadCount || 0}
      categoryCount={categories.length}
      recentUploads={recentCount}
    />
  );
}
