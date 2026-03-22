"use client";

import { Button } from "@repo/ui";
import { BookOpen, RefreshCw } from "lucide-react";

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <BookOpen className="h-16 w-16 text-muted-foreground/30" />
      <h2 className="text-xl font-semibold">Unable to load the library</h2>
      <p className="text-muted-foreground max-w-md">
        Something went wrong while loading the digital library. Please try again.
      </p>
      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
