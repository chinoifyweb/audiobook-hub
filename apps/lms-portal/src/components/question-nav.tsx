"use client";

import { cn } from "@repo/ui";

interface QuestionNavProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onNavigate: (index: number) => void;
}

export function QuestionNav({
  totalQuestions,
  currentIndex,
  answeredIndices,
  onNavigate,
}: QuestionNavProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Questions</h3>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isActive = i === currentIndex;
          const isAnswered = answeredIndices.has(i);

          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isAnswered
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary" />
          Current
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-green-100 border border-green-300" />
          Answered
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-muted" />
          Unanswered
        </div>
      </div>
    </div>
  );
}
