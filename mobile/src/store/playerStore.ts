import { create } from 'zustand';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { AudioFile, Book } from '../types';

interface PlayerState {
  sound: Audio.Sound | null;
  currentBook: Book | null;
  currentChapter: AudioFile | null;
  chapters: AudioFile[];
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  position: number;
  playbackRate: number;
  sleepTimer: number | null;
  sleepTimerInterval: ReturnType<typeof setInterval> | null;

  // Actions
  loadBook: (book: Book, chapters: AudioFile[], startChapter?: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  nextChapter: () => Promise<void>;
  previousChapter: () => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
  setSleepTimer: (minutes: number | null) => void;
  cleanup: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  sound: null,
  currentBook: null,
  currentChapter: null,
  chapters: [],
  isPlaying: false,
  isLoading: false,
  duration: 0,
  position: 0,
  playbackRate: 1.0,
  sleepTimer: null,
  sleepTimerInterval: null,

  loadBook: async (book, chapters, startChapter = 0) => {
    const { sound: existingSound } = get();
    if (existingSound) {
      await existingSound.unloadAsync();
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const chapter = chapters[startChapter];
    if (!chapter) return;

    set({ isLoading: true, currentBook: book, chapters });

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: chapter.fileUrl },
        {
          shouldPlay: false,
          rate: get().playbackRate,
          progressUpdateIntervalMillis: 500,
        },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            set({
              position: status.positionMillis / 1000,
              duration: (status.durationMillis || 0) / 1000,
              isPlaying: status.isPlaying,
            });

            if (status.didJustFinish) {
              get().nextChapter();
            }
          }
        }
      );

      set({ sound, currentChapter: chapter, isLoading: false });
    } catch (error) {
      console.error('Error loading audio:', error);
      set({ isLoading: false });
    }
  },

  play: async () => {
    const { sound } = get();
    if (sound) {
      await sound.playAsync();
      set({ isPlaying: true });
    }
  },

  pause: async () => {
    const { sound } = get();
    if (sound) {
      await sound.pauseAsync();
      set({ isPlaying: false });
    }
  },

  togglePlayPause: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await get().pause();
    } else {
      await get().play();
    }
  },

  seekTo: async (position) => {
    const { sound } = get();
    if (sound) {
      await sound.setPositionAsync(position * 1000);
    }
  },

  skipForward: async (seconds = 30) => {
    const { sound, position, duration } = get();
    if (sound) {
      const newPos = Math.min(position + seconds, duration);
      await sound.setPositionAsync(newPos * 1000);
    }
  },

  skipBackward: async (seconds = 15) => {
    const { sound, position } = get();
    if (sound) {
      const newPos = Math.max(position - seconds, 0);
      await sound.setPositionAsync(newPos * 1000);
    }
  },

  nextChapter: async () => {
    const { chapters, currentChapter, currentBook } = get();
    if (!currentChapter || !currentBook) return;
    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1];
      const { sound: existingSound } = get();
      if (existingSound) await existingSound.unloadAsync();

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: nextChapter.fileUrl },
          {
            shouldPlay: true,
            rate: get().playbackRate,
            progressUpdateIntervalMillis: 500,
          },
          (status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              set({
                position: status.positionMillis / 1000,
                duration: (status.durationMillis || 0) / 1000,
                isPlaying: status.isPlaying,
              });
              if (status.didJustFinish) get().nextChapter();
            }
          }
        );
        set({ sound, currentChapter: nextChapter });
      } catch (error) {
        console.error('Error loading next chapter:', error);
      }
    }
  },

  previousChapter: async () => {
    const { chapters, currentChapter, currentBook, position } = get();
    if (!currentChapter || !currentBook) return;

    // If past 3 seconds, restart current chapter
    if (position > 3) {
      const { sound } = get();
      if (sound) await sound.setPositionAsync(0);
      return;
    }

    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      const { sound: existingSound } = get();
      if (existingSound) await existingSound.unloadAsync();

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: prevChapter.fileUrl },
          {
            shouldPlay: true,
            rate: get().playbackRate,
            progressUpdateIntervalMillis: 500,
          },
          (status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              set({
                position: status.positionMillis / 1000,
                duration: (status.durationMillis || 0) / 1000,
                isPlaying: status.isPlaying,
              });
              if (status.didJustFinish) get().nextChapter();
            }
          }
        );
        set({ sound, currentChapter: prevChapter });
      } catch (error) {
        console.error('Error loading previous chapter:', error);
      }
    }
  },

  setPlaybackRate: async (rate) => {
    const { sound } = get();
    if (sound) {
      await sound.setRateAsync(rate, true);
    }
    set({ playbackRate: rate });
  },

  setSleepTimer: (minutes) => {
    const { sleepTimerInterval } = get();
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
    }

    if (minutes === null) {
      set({ sleepTimer: null, sleepTimerInterval: null });
      return;
    }

    let remaining = minutes * 60;
    const interval = setInterval(() => {
      remaining -= 1;
      set({ sleepTimer: remaining });
      if (remaining <= 0) {
        get().pause();
        clearInterval(interval);
        set({ sleepTimer: null, sleepTimerInterval: null });
      }
    }, 1000);

    set({ sleepTimer: remaining, sleepTimerInterval: interval });
  },

  cleanup: async () => {
    const { sound, sleepTimerInterval } = get();
    if (sound) {
      await sound.unloadAsync();
    }
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
    }
    set({
      sound: null,
      currentBook: null,
      currentChapter: null,
      chapters: [],
      isPlaying: false,
      duration: 0,
      position: 0,
      sleepTimer: null,
      sleepTimerInterval: null,
    });
  },
}));
