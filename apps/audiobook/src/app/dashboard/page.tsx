import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { LibraryContent, type LibraryBook } from "@/components/dashboard/library-content";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "My Library — AudioShelf",
  description: "Your personal audiobook and ebook library",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const libraryItems = await prisma.userLibrary.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { lastAccessedAt: { sort: "desc", nulls: "last" } },
      { addedAt: "desc" },
    ],
    include: {
      book: {
        include: {
          author: {
            select: {
              penName: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          audioFiles: {
            select: {
              id: true,
              durationSeconds: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  // Map to plain serializable objects
  const books: LibraryBook[] = libraryItems.map((item) => ({
    id: item.id,
    bookId: item.bookId,
    accessType: item.accessType as "purchased" | "subscription",
    listeningProgress: item.listeningProgress as LibraryBook["listeningProgress"],
    readingProgress: item.readingProgress as LibraryBook["readingProgress"],
    book: {
      id: item.book.id,
      title: item.book.title,
      slug: item.book.slug,
      coverImageUrl: item.book.coverImageUrl,
      bookType: item.book.bookType as "ebook" | "audiobook" | "both",
      genre: item.book.genre,
      author: {
        penName: item.book.author.penName,
        user: {
          fullName: item.book.author.user.fullName,
        },
      },
      audioFiles: item.book.audioFiles.map((af) => ({
        id: af.id,
        durationSeconds: af.durationSeconds,
      })),
    },
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your purchased and subscription audiobooks and ebooks
        </p>
      </div>

      <LibraryContent books={books} />
    </div>
  );
}
