"use client";

import { useState } from "react";
import { Play, Maximize2, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  title: string;
  type: "youtube_video" | "video";
}

function getYouTubeEmbedUrl(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  // If it's already an embed URL, return as-is
  if (url.includes("youtube.com/embed/")) return url;
  return url.replace("watch?v=", "embed/");
}

export function VideoPlayer({ url, title, type }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (type === "youtube_video") {
    const embedUrl = getYouTubeEmbedUrl(url);

    if (!isPlaying) {
      // Show thumbnail with play button overlay
      const videoId = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
      )?.[1];
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : null;

      return (
        <div
          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-gray-900 group"
          onClick={() => setIsPlaying(true)}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <span className="text-white/60 text-sm">{title}</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg group-hover:bg-white group-hover:scale-110 transition-all">
              <Play className="h-7 w-7 text-gray-900 ml-1" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-white text-sm font-medium">{title}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          className="w-full h-full"
          src={`${embedUrl}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // HTML5 video player for direct video URLs
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        className="w-full h-full"
        controls
        preload="metadata"
        controlsList="nodownload"
      >
        <source src={url} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
