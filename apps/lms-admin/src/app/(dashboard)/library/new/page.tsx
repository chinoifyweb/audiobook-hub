import { LibraryBookForm } from "../book-form";

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Book</h1>
        <p className="text-muted-foreground">
          Upload a new book to the digital library
        </p>
      </div>
      <LibraryBookForm />
    </div>
  );
}
