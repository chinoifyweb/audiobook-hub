import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import { LibraryBookForm } from "../../book-form";

export const dynamic = "force-dynamic";

export default async function EditBookPage({
  params,
}: {
  params: { id: string };
}) {
  const book = await prisma.libraryBook.findUnique({
    where: { id: params.id },
  });

  if (!book) {
    notFound();
  }

  const serialized = {
    ...book,
    fileSize: book.fileSize.toString(),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Book</h1>
        <p className="text-muted-foreground">
          Update book details and files
        </p>
      </div>
      <LibraryBookForm book={serialized} />
    </div>
  );
}
