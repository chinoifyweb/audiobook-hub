"use client";

import { Button, cn } from "@repo/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  // Clock,
  ListMusic,
  ChevronLeft,
  Headphones,
  Gauge,
  Moon,
  Check,
} from "lucide-react";



// ─── Types ──────────────────────────────────────────────────────────────────

interface AudioFileData {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  fileUrl: string;
  durationSeconds: number;
  sortOrder: number;
}

interface BookData {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  authorName: string;
  audioFiles: AudioFileData[];
}

interface ListeningProgress {
  chapter: number;
  position_seconds: number;
}

interface AudioPlayerProps {
  book: BookData;
  initialProgress: ListeningProgress | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

const SLEEP_TIMER_OPTIONS = [
  { label: "Off", minutes: 0 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "60 min", minutes: 60 },
] as const;

const PROGRESS_SAVE_INTERVAL = 30_000; // 30 seconds

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatChapterDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Progress Save ──────────────────────────────────────────────────────────

async function saveProgress(bookId: string, chapter: number, positionSeconds: number) {
  try {
    await fetch("/api/library/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId,
        listeningProgress: {
          chapter,
          position_seconds: Math.floor(positionSeconds),
        },
      }),
    });
  } catch {
    // Silently fail — will retry on next interval
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AudioPlayer({ book, initialProgress }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Controls state
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0);
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);

  // UI state
  const [showChapterList, setShowChapterList] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const currentChapter = book.audioFiles[currentChapterIndex];
  // Total duration across all chapters
  void book.audioFiles.reduce((sum, f) => sum + f.durationSeconds, 0);

  // ─── Initialize from saved progress ─────────────────────────────────────

  useEffect(() => {
    if (hasInitialized || !initialProgress) return;

    const chapterIdx = book.audioFiles.findIndex(
      (f) => f.chapterNumber === initialProgress.chapter
    );
    if (chapterIdx >= 0) {
      setCurrentChapterIndex(chapterIdx);
    }

    // Position will be set once the audio loads (in onLoadedMetadata)
    setHasInitialized(true);
  }, [initialProgress, book.audioFiles, hasInitialized]);

  // ─── Audio source management ────────────────────────────────────────────

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter) return;

    const wasPlaying = isPlaying;
    audio.src = currentChapter.fileUrl;
    audio.playbackRate = playbackSpeed;
    audio.load();
    setIsLoading(true);

    if (wasPlaying) {
      audio.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterIndex]);

  // ─── Audio event handlers ───────────────────────────────────────────────

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);

      // Restore position on initial load
      if (
        initialProgress &&
        !hasInitialized &&
        book.audioFiles[currentChapterIndex]?.chapterNumber === initialProgress.chapter
      ) {
        audio.currentTime = initialProgress.position_seconds;
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      // Move to next chapter
      if (currentChapterIndex < book.audioFiles.length - 1) {
        setCurrentChapterIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
        saveProgress(book.id, currentChapter.chapterNumber, audio.duration);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterIndex, book.audioFiles.length]);

  // ─── Periodic progress saving ───────────────────────────────────────────

  useEffect(() => {
    if (isPlaying) {
      saveTimerRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio && currentChapter) {
          saveProgress(book.id, currentChapter.chapterNumber, audio.currentTime);
        }
      }, PROGRESS_SAVE_INTERVAL);
    }

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [isPlaying, book.id, currentChapter]);

  // ─── Sleep timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (sleepTimerMinutes > 0) {
      const endTime = Date.now() + sleepTimerMinutes * 60 * 1000;
      setSleepTimerEnd(endTime);

      sleepTimerRef.current = setTimeout(() => {
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
        }
        setSleepTimerMinutes(0);
        setSleepTimerEnd(null);
        setSleepTimeRemaining(null);
      }, sleepTimerMinutes * 60 * 1000);
    } else {
      setSleepTimerEnd(null);
      setSleepTimeRemaining(null);
    }

    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, [sleepTimerMinutes]);

  // Update remaining time display for sleep timer
  useEffect(() => {
    if (!sleepTimerEnd) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, sleepTimerEnd - Date.now());
      setSleepTimeRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerEnd]);

  // ─── Playback controls ─────────────────────────────────────────────────

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 30, audio.duration);
  }, []);

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  }, []);

  const goToChapter = useCallback(
    (index: number) => {
      if (index < 0 || index >= book.audioFiles.length) return;

      // Save progress before switching
      const audio = audioRef.current;
      if (audio && currentChapter) {
        saveProgress(book.id, currentChapter.chapterNumber, audio.currentTime);
      }

      setCurrentChapterIndex(index);
      setShowChapterList(false);
    },
    [book.audioFiles.length, book.id, currentChapter]
  );

  const prevChapter = useCallback(() => {
    goToChapter(currentChapterIndex - 1);
  }, [currentChapterIndex, goToChapter]);

  const nextChapter = useCallback(() => {
    goToChapter(currentChapterIndex + 1);
  }, [currentChapterIndex, goToChapter]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressBarRef.current;
      if (!audio || !bar) return;

      const rect = bar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = percent * audio.duration;
    },
    []
  );

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audio.muted = newMuted;
  }, [isMuted]);

  // Speed cycling is handled inline in the JSX speed button onClick
  void playbackSpeed; // used in JSX

  const selectSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  const selectSleepTimer = useCallback((minutes: number) => {
    setSleepTimerMinutes(minutes);
    setShowSleepMenu(false);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) {
        setShowSpeedMenu(false);
        setShowSleepMenu(false);
        setShowVolumeSlider(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ─── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipBack();
          break;
        case "ArrowUp":
          e.preventDefault();
          if (audioRef.current) {
            const newVol = Math.min(1, volume + 0.1);
            setVolume(newVol);
            audioRef.current.volume = newVol;
            setIsMuted(false);
            audioRef.current.muted = false;
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (audioRef.current) {
            const newVol = Math.max(0, volume - 0.1);
            setVolume(newVol);
            audioRef.current.volume = newVol;
          }
          break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePlayPause, skipForward, skipBack, volume]);

  // Save on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio && currentChapter) {
        saveProgress(book.id, currentChapter.chapterNumber, audio.currentTime);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Progress calculation ───────────────────────────────────────────────

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />

      <div className="relative flex min-h-screen flex-col items-center">
        {/* Top navigation bar */}
        <div className="sticky top-0 z-30 flex w-full items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Library</span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Volume control */}
            <div className="relative" data-menu>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVolumeSlider((prev) => !prev);
                  setShowSpeedMenu(false);
                  setShowSleepMenu(false);
                }}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              {showVolumeSlider && (
                <div className="absolute right-0 top-full z-40 mt-2 rounded-xl bg-zinc-800 p-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-zinc-600 accent-emerald-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                    />
                    <span className="min-w-[2.5rem] text-right text-xs text-zinc-400">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chapter list toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 hover:bg-zinc-800 hover:text-white",
                showChapterList ? "text-emerald-400" : "text-zinc-400"
              )}
              onClick={() => setShowChapterList((prev) => !prev)}
            >
              <ListMusic className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main player content */}
        <div className="flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 pb-8 pt-2">
          {/* Cover Art */}
          <div className="relative mb-8 aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl shadow-2xl shadow-black/50 sm:max-w-[360px]">
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt={book.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900 via-zinc-800 to-zinc-900">
                <Headphones className="h-24 w-24 text-emerald-400/40" />
              </div>
            )}
          </div>

          {/* Book info */}
          <div className="mb-6 w-full text-center">
            <h1 className="mb-1 truncate text-xl font-bold text-white sm:text-2xl">
              {book.title}
            </h1>
            <p className="text-sm text-zinc-400">{book.authorName}</p>
            <p className="mt-1 text-xs text-emerald-400">
              {currentChapter?.chapterTitle}
              <span className="mx-1.5 text-zinc-600">|</span>
              <span className="text-zinc-500">
                {currentChapterIndex + 1} of {book.audioFiles.length}
              </span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-2 w-full">
            <div
              ref={progressBarRef}
              className="group relative h-1.5 w-full cursor-pointer rounded-full bg-zinc-700 transition-all hover:h-2.5"
              onClick={handleSeek}
              role="progressbar"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-zinc-500">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="mb-6 flex w-full items-center justify-center gap-3 sm:gap-5">
            {/* Previous chapter */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
              onClick={prevChapter}
              disabled={currentChapterIndex === 0}
              aria-label="Previous chapter"
            >
              <SkipBack className="h-5 w-5 fill-current" />
            </Button>

            {/* Skip back 15s */}
            <button
              className="relative flex h-12 w-12 items-center justify-center text-zinc-300 transition-colors hover:text-white"
              onClick={skipBack}
              aria-label="Skip back 15 seconds"
            >
              <SkipBack className="h-6 w-6" />
              <span className="absolute -bottom-0.5 text-[9px] font-bold">15</span>
            </button>

            {/* Play / Pause */}
            <button
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full transition-all sm:h-18 sm:w-18",
                isPlaying
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-white text-black hover:bg-zinc-200",
                isLoading && "animate-pulse"
              )}
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 fill-current sm:h-8 sm:w-8" />
              ) : (
                <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
              )}
            </button>

            {/* Skip forward 30s */}
            <button
              className="relative flex h-12 w-12 items-center justify-center text-zinc-300 transition-colors hover:text-white"
              onClick={skipForward}
              aria-label="Skip forward 30 seconds"
            >
              <SkipForward className="h-6 w-6" />
              <span className="absolute -bottom-0.5 text-[9px] font-bold">30</span>
            </button>

            {/* Next chapter */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
              onClick={nextChapter}
              disabled={currentChapterIndex === book.audioFiles.length - 1}
              aria-label="Next chapter"
            >
              <SkipForward className="h-5 w-5 fill-current" />
            </Button>
          </div>

          {/* Secondary controls row */}
          <div className="flex w-full items-center justify-center gap-6">
            {/* Playback speed */}
            <div className="relative" data-menu>
              <button
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  playbackSpeed !== 1
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedMenu((prev) => !prev);
                  setShowSleepMenu(false);
                  setShowVolumeSlider(false);
                }}
                aria-label={`Playback speed: ${playbackSpeed}x`}
              >
                <Gauge className="h-3.5 w-3.5" />
                {playbackSpeed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 rounded-xl bg-zinc-800 p-2 shadow-2xl">
                  <div className="flex flex-col gap-0.5">
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        className={cn(
                          "flex items-center justify-between gap-4 rounded-lg px-4 py-2 text-sm transition-colors",
                          speed === playbackSpeed
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "text-zinc-300 hover:bg-zinc-700"
                        )}
                        onClick={() => selectSpeed(speed)}
                      >
                        <span>{speed}x</span>
                        {speed === playbackSpeed && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sleep timer */}
            <div className="relative" data-menu>
              <button
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  sleepTimerMinutes > 0
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSleepMenu((prev) => !prev);
                  setShowSpeedMenu(false);
                  setShowVolumeSlider(false);
                }}
                aria-label="Sleep timer"
              >
                <Moon className="h-3.5 w-3.5" />
                {sleepTimerMinutes > 0 && sleepTimeRemaining !== null
                  ? formatTime(sleepTimeRemaining)
                  : "Sleep"}
              </button>

              {showSleepMenu && (
                <div className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 rounded-xl bg-zinc-800 p-2 shadow-2xl">
                  <div className="flex flex-col gap-0.5">
                    {SLEEP_TIMER_OPTIONS.map((option) => (
                      <button
                        key={option.minutes}
                        className={cn(
                          "flex items-center justify-between gap-4 rounded-lg px-4 py-2 text-sm transition-colors",
                          option.minutes === sleepTimerMinutes
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "text-zinc-300 hover:bg-zinc-700"
                        )}
                        onClick={() => selectSleepTimer(option.minutes)}
                      >
                        <span>{option.label}</span>
                        {option.minutes === sleepTimerMinutes && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chapter list panel (slide-up overlay) */}
        {showChapterList && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setShowChapterList(false)}
            />

            {/* Panel */}
            <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-2xl bg-zinc-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <h3 className="text-sm font-semibold text-white">
                  Chapters ({book.audioFiles.length})
                </h3>
                <button
                  className="text-xs text-zinc-400 hover:text-white"
                  onClick={() => setShowChapterList(false)}
                >
                  Close
                </button>
              </div>

              <div className="overflow-y-auto px-2 py-2" style={{ maxHeight: "calc(70vh - 60px)" }}>
                {book.audioFiles.map((file, index) => {
                  const isActive = index === currentChapterIndex;
                  return (
                    <button
                      key={file.id}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-zinc-300 hover:bg-zinc-800"
                      )}
                      onClick={() => goToChapter(index)}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          isActive
                            ? "bg-emerald-500 text-black"
                            : "bg-zinc-800 text-zinc-400"
                        )}
                      >
                        {isActive && isPlaying ? (
                          <span className="flex items-center gap-0.5">
                            <span className="inline-block h-2.5 w-0.5 animate-pulse rounded-full bg-black" />
                            <span className="inline-block h-3.5 w-0.5 animate-pulse rounded-full bg-black [animation-delay:150ms]" />
                            <span className="inline-block h-2 w-0.5 animate-pulse rounded-full bg-black [animation-delay:300ms]" />
                          </span>
                        ) : (
                          file.chapterNumber
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            isActive ? "text-emerald-400" : "text-zinc-200"
                          )}
                        >
                          {file.chapterTitle}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatChapterDuration(file.durationSeconds)}
                        </p>
                      </div>

                      {isActive && (
                        <div className="text-xs text-emerald-400">
                          Playing
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
