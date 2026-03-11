import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AudioPlayer } from "@/components/player/audio-player";

interface PlayerPageProps {
  params: { bookId: string };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { bookId } = params;

  // Fetch book with audio files and author info
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      audioFiles: {
        orderBy: { sortOrder: "asc" },
      },
      author: {
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!book) {
    redirect("/dashboard");
  }

  // Check user has access via library
  const libraryEntry = await prisma.userLibrary.findUnique({
    where: {
      userId_bookId: {
        userId: session.user.id,
        bookId,
      },
    },
  });

  if (!libraryEntry) {
    redirect(`/books/${book.slug}`);
  }

  // No audio files available
  if (book.audioFiles.length === 0) {
    redirect("/dashboard");
  }

  // Serialize data for client component
  const serializedBook = {
    id: book.id,
    title: book.title,
    slug: book.slug,
    coverImageUrl: book.coverImageUrl,
    authorName: book.author.penName || book.author.user.fullName || "Unknown Author",
    audioFiles: book.audioFiles.map((file) => ({
      id: file.id,
      chapterNumber: file.chapterNumber,
      chapterTitle: file.chapterTitle || `Chapter ${file.chapterNumber}`,
      fileUrl: file.fileUrl,
      durationSeconds: file.durationSeconds,
      sortOrder: file.sortOrder,
    })),
  };

  const listeningProgress = libraryEntry.listeningProgress as {
    chapter: number;
    position_seconds: number;
  } | null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <AudioPlayer
        book={serializedBook}
        initialProgress={listeningProgress}
      />
    </div>
  );
}
