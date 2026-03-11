import { useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { libraryAPI } from '../lib/api';

export function usePlayer() {
  const store = usePlayerStore();

  // Auto-save progress every 10 seconds while playing
  useEffect(() => {
    if (!store.isPlaying || !store.currentBook || !store.currentChapter) return;

    const interval = setInterval(async () => {
      try {
        await libraryAPI.updateProgress(store.currentBook!.id, {
          listeningProgress: {
            chapter: store.currentChapter!.chapterNumber,
            positionSeconds: Math.floor(store.position),
          },
        });
      } catch (error) {
        // Silently fail - progress saving is non-critical
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [store.isPlaying, store.currentBook?.id, store.currentChapter?.id]);

  return store;
}
