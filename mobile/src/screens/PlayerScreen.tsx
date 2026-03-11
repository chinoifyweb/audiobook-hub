import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { useRoute, useNavigation } from '@react-navigation/native';
import { booksAPI } from '../lib/api';
import { usePlayerStore } from '../store/playerStore';
import { Book, AudioFile } from '../types';
import { COLORS } from '../lib/constants';

const { width } = Dimensions.get('window');

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const SLEEP_OPTIONS = [null, 5, 15, 30, 45, 60];

export default function PlayerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { bookId } = route.params;
  const [book, setBook] = useState<Book | null>(null);

  const {
    currentBook,
    currentChapter,
    isPlaying,
    isLoading,
    position,
    duration,
    playbackRate,
    sleepTimer,
    loadBook,
    togglePlayPause,
    skipForward,
    skipBackward,
    nextChapter,
    previousChapter,
    setPlaybackRate,
    setSleepTimer,
    seekTo,
  } = usePlayerStore();

  useEffect(() => {
    const fetchAndLoad = async () => {
      try {
        const response = await booksAPI.getBySlug(bookId);
        const fetchedBook = response.data?.book;
        const chapters: AudioFile[] = response.data?.chapters || [];
        setBook(fetchedBook);
        if (fetchedBook && chapters.length > 0) {
          if (!currentBook || currentBook.id !== fetchedBook.id) {
            await loadBook(fetchedBook, chapters);
          }
        }
      } catch (error) {
        console.error('Error loading player:', error);
      }
    };
    fetchAndLoad();
  }, [bookId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showSpeedPicker = () => {
    Alert.alert(
      'Playback Speed',
      'Select speed',
      PLAYBACK_RATES.map((rate) => ({
        text: `${rate}x${rate === playbackRate ? ' (current)' : ''}`,
        onPress: () => setPlaybackRate(rate),
      }))
    );
  };

  const showSleepTimer = () => {
    Alert.alert(
      'Sleep Timer',
      'Select duration',
      SLEEP_OPTIONS.map((mins) => ({
        text: mins === null
          ? `Off${sleepTimer === null ? ' (current)' : ''}`
          : `${mins} minutes`,
        onPress: () => setSleepTimer(mins),
      }))
    );
  };

  const displayBook = currentBook || book;

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeBtnText}>Done</Text>
      </TouchableOpacity>

      {/* Cover Art */}
      <View style={styles.coverContainer}>
        {displayBook?.coverImageUrl ? (
          <Image
            source={{ uri: displayBook.coverImageUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>
              {displayBook?.title?.[0] || '?'}
            </Text>
          </View>
        )}
      </View>

      {/* Book Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {displayBook?.title || 'Loading...'}
        </Text>
        <Text style={styles.author}>
          {displayBook?.author?.penName || ''}
        </Text>
        {currentChapter && (
          <Text style={styles.chapter}>{currentChapter.chapterTitle}</Text>
        )}
      </View>

      {/* Progress Slider */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={position}
          onSlidingComplete={seekTo}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor={COLORS.surfaceLight}
          thumbTintColor={COLORS.primary}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={previousChapter}>
          <Text style={styles.controlIcon}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => skipBackward(15)}>
          <Text style={styles.skipText}>-15s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          <Text style={styles.playIcon}>
            {isLoading ? '...' : isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => skipForward(30)}>
          <Text style={styles.skipText}>+30s</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nextChapter}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Extra Controls */}
      <View style={styles.extraControls}>
        <TouchableOpacity style={styles.extraBtn} onPress={showSpeedPicker}>
          <Text style={styles.extraBtnText}>{playbackRate}x</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.extraBtn} onPress={showSleepTimer}>
          <Text style={styles.extraBtnText}>
            {sleepTimer !== null
              ? `${Math.ceil(sleepTimer / 60)}m`
              : 'Sleep'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  coverContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  coverImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 16,
  },
  coverPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  info: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  author: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  chapter: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 16,
  },
  controlIcon: {
    fontSize: 28,
    color: COLORS.text,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 28,
    color: COLORS.white,
  },
  extraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 24,
  },
  extraBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  extraBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
