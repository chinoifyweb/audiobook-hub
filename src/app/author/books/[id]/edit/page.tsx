import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EditBookForm } from "@/components/author/edit-book-form";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const authorProfile = await prisma.authorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, commissionRate: true },
  });

  if (!authorProfile) redirect("/dashboard");

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      audioFiles: { orderBy: { sortOrder: "asc" } },
      ebookFiles: true,
    },
  });

  if (!book || book.authorId !== authorProfile.id) {
    notFound();
  }

  const isEditable = book.status === "draft" || book.status === "rejected";

  const bookData = {
    id: book.id,
    title: book.title,
    description: book.description || "",
    shortDescription: book.shortDescription || "",
    genre: book.genre || "",
    subGenre: book.subGenre || "",
    language: book.language,
    isbn: book.isbn || "",
    bookType: book.bookType,
    price: book.price,
    isFree: book.isFree,
    status: book.status,
    rejectionReason: book.rejectionReason,
    coverImageUrl: book.coverImageUrl,
    commissionRate: Number(authorProfile.commissionRate),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Book</h1>
        <p className="text-muted-foreground">
          {isEditable
            ? "Update your book details below."
            : "This book is currently not editable. Only draft or rejected books can be edited."}
        </p>
      </div>

      {book.status === "rejected" && book.rejectionReason && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
          <p className="mt-1 text-sm text-destructive/80">{book.rejectionReason}</p>
        </div>
      )}

      <EditBookForm book={bookData} isEditable={isEditable} />
    </div>
  );
}
