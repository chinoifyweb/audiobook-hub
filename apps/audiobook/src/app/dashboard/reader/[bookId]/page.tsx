import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/db";
import { EbookReader } from "./ebook-reader";

export const dynamic = 'force-dynamic';

interface ReaderPageProps {
  params: { bookId: string };
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { bookId } = params;

  // Fetch book with ebook files and author info
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      ebookFiles: true,
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

  // No ebook files available
  if (book.ebookFiles.length === 0) {
    redirect("/dashboard");
  }

  const serializedBook = {
    id: book.id,
    title: book.title,
    slug: book.slug,
    coverImageUrl: book.coverImageUrl,
    authorName:
      book.author.penName || book.author.user.fullName || "Unknown Author",
    pageCount: book.pageCount || 0,
    description: book.shortDescription || book.description || "",
    ebookFiles: book.ebookFiles.map((file) => ({
      id: file.id,
      format: file.format,
      fileUrl: file.fileUrl,
    })),
  };

  const readingProgress = libraryEntry.readingProgress as {
    page: number;
    percentage: number;
  } | null;

  return (
    <EbookReader book={serializedBook} initialProgress={readingProgress} />
  );
}
