"use client";

import { useEffect } from "react";
import { cn } from "@repo/ui";

interface QuizTimerProps {
  timeRemainingSeconds: number;
  totalSeconds: number;
  onTick: () => void;
  onTimeUp: () => void;
  /** Show a compact inline timer instead of circular dials */
  compact?: boolean;
}

function CircularDial({
  value,
  max,
  label,
  color,
  size = 72,
}: {
  value: number;
  max: number;
  label: string;
  color: "green" | "blue" | "red" | "orange";
  size?: number;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    green: "text-green-500",
    blue: "text-blue-500",
    red: "text-red-500",
    orange: "text-orange-500",
  };

  const bgColorClasses = {
    green: "text-green-100",
    blue: "text-blue-100",
    red: "text-red-100",
    orange: "text-orange-100",
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={bgColorClasses[color]}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-1000", colorClasses[color])}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">
            {String(value).padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-gray-500 mt-1.5 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function QuizTimer({
  timeRemainingSeconds,
  totalSeconds,
  onTick,
  onTimeUp,
  compact = false,
}: QuizTimerProps) {
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

  const isLow = timeRemainingSeconds <= 300;
  const isCritical = timeRemainingSeconds <= 60;

  const minuteColor = isCritical ? "red" : isLow ? "orange" : "green";
  const secondColor = isCritical ? "red" : isLow ? "orange" : "blue";
  const hourColor = isCritical ? "red" : isLow ? "orange" : "green";

  if (compact) {
    const timeStr = hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Time Remaining</span>
        <span
          className={cn(
            "text-lg font-mono font-bold",
            isCritical ? "text-red-600 animate-pulse" : isLow ? "text-orange-600" : "text-blue-700"
          )}
        >
          {timeStr}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 text-center">Time Remaining</h3>
      <div className="flex items-center justify-center gap-3">
        {hours > 0 && (
          <CircularDial
            value={hours}
            max={Math.ceil(totalSeconds / 3600)}
            label="Hours"
            color={hourColor}
          />
        )}
        <CircularDial
          value={minutes}
          max={59}
          label="Minutes"
          color={minuteColor}
        />
        <CircularDial
          value={seconds}
          max={59}
          label="Seconds"
          color={secondColor}
        />
      </div>
      {isCritical && (
        <p className="text-center text-xs text-red-600 font-medium animate-pulse">
          Time is almost up!
        </p>
      )}
    </div>
  );
}
