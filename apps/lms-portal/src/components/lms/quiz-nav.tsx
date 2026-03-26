"use client";

import { useState, useEffect } from "react";
import { cn } from "@repo/ui";
import { Check, Flag } from "lucide-react";

interface QuizNavProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  flaggedIndices: Set<number>;
  onNavigate: (index: number) => void;
  /** Pass correctness data for review mode */
  correctIndices?: Set<number>;
  incorrectIndices?: Set<number>;
  reviewMode?: boolean;
}

export function QuizNav({
  totalQuestions,
  currentIndex,
  answeredIndices,
  flaggedIndices,
  onNavigate,
  correctIndices,
  incorrectIndices,
  reviewMode = false,
}: QuizNavProps) {
  const [lastSaved, setLastSaved] = useState<string>("");

  useEffect(() => {
    // Update last saved timestamp whenever answers change
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(2);
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    const secs = String(now.getSeconds()).padStart(2, "0");
    setLastSaved(`${day}/${month}/${year}, ${hours}:${mins}:${secs}`);
  }, [answeredIndices.size]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Quiz Navigation</h3>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isActive = i === currentIndex;
          const isAnswered = answeredIndices.has(i);
          const isFlagged = flaggedIndices.has(i);
          const isCorrect = correctIndices?.has(i);
          const isIncorrect = incorrectIndices?.has(i);

          let bgClass = "bg-gray-100 text-gray-500 hover:bg-gray-200";
          let borderClass = "";

          if (reviewMode) {
            if (isCorrect) {
              bgClass = "bg-green-100 text-green-700";
            } else if (isIncorrect) {
              bgClass = "bg-red-100 text-red-700";
            }
          } else if (isActive) {
            bgClass = "bg-white text-blue-700";
            borderClass = "ring-2 ring-green-500";
          } else if (isAnswered) {
            bgClass = "bg-blue-600 text-white";
          }

          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-all",
                bgClass,
                borderClass
              )}
            >
              {/* Show checkmark for correct answers in review mode */}
              {reviewMode && isCorrect ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}

              {/* Flag indicator */}
              {isFlagged && !reviewMode && (
                <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500 fill-orange-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Last saved timestamp */}
      {!reviewMode && lastSaved && (
        <p className="text-xs text-gray-400">
          Last saved: {lastSaved}
        </p>
      )}

      {/* Legend */}
      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Legend</p>
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          {reviewMode ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-100 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-green-700" />
                </div>
                <span className="text-gray-600">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-100" />
                <span className="text-gray-600">Incorrect</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-white ring-2 ring-green-500" />
                <span className="text-gray-600">Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-blue-600" />
                <span className="text-gray-600">Answer Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-100" />
                <span className="text-gray-600">Not Yet Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                <span className="text-gray-600">Flagged</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
