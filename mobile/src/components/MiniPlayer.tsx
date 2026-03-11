import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/playerStore';
import { COLORS } from '../lib/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MiniPlayer() {
  const navigation = useNavigation<NavigationProp>();
  const { currentBook, currentChapter, isPlaying, togglePlayPause } =
    usePlayerStore();

  if (!currentBook) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player', { bookId: currentBook.id })}
      activeOpacity={0.9}
    >
      {currentBook.coverImageUrl ? (
        <Image
          source={{ uri: currentBook.coverImageUrl }}
          style={styles.cover}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.placeholderText}>{currentBook.title[0]}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {currentBook.title}
        </Text>
        <Text style={styles.chapter} numberOfLines={1}>
          {currentChapter?.chapterTitle || 'Loading...'}
        </Text>
      </View>

      <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  coverPlaceholder: {
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  chapter: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: COLORS.white,
  },
});
