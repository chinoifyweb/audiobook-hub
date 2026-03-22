"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentReader } from "@/components/lms/document-reader";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Download,
  BookOpen,
} from "lucide-react";

interface BookData {
  id: string;
  title: string;
  author: string;
  fileUrl: string;
  fileType: string;
  category: string;
}

export default function LibraryReadPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [book, setBook] = useState<BookData | null>(null);

  const bookId = params.bookId as string;

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`/api/library/${bookId}`);
        if (!res.ok) {
          setError("Book not found");
          return;
        }
        const data = await res.json();
        setBook(data);
      } catch {
        setError("Failed to load book");
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-amber-600 mb-4" />
        <p className="text-gray-500">Loading book...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error || "Failed to load book"}</p>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6">
      {/* Top header bar */}
      <div className="bg-white border-b px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/library"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Library</span>
          </Link>
          <div className="h-5 w-px bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">
              {book.title}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              by {book.author}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={book.fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-700 text-white hover:bg-amber-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>

      {/* Document Reader */}
      <div className="flex-1 min-h-0">
        <DocumentReader
          fileUrl={book.fileUrl}
          fileName={`${book.title}.${book.fileType}`}
          fileType={book.fileType}
        />
      </div>
    </div>
  );
}
