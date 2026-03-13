"use client";

import { useEffect } from "react";
import { cn } from "@repo/ui";
import { Clock, AlertTriangle } from "lucide-react";

interface TimerProps {
  timeRemainingSeconds: number;
  onTick: () => void;
  onTimeUp: () => void;
}

export function Timer({ timeRemainingSeconds, onTick, onTimeUp }: TimerProps) {
  useEffect(() => {
    if (timeRemainingSeconds <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      onTick();
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemainingSeconds, onTick, onTimeUp]);

  const hours = Math.floor(timeRemainingSeconds / 3600);
  const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
  const seconds = timeRemainingSeconds % 60;

  const isLow = timeRemainingSeconds <= 300; // 5 minutes
  const isCritical = timeRemainingSeconds <= 60; // 1 minute

  const timeString = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold",
        isCritical
          ? "bg-red-100 text-red-700 animate-pulse"
          : isLow
            ? "bg-orange-100 text-orange-700"
            : "bg-muted text-foreground"
      )}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      {timeString}
    </div>
  );
}
