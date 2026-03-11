import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'react-native';
import { Book } from '../types';
import { COLORS } from '../lib/constants';

const { width } = Dimensions.get('window');

interface BookCardProps {
  book: Book;
  onPress: () => void;
  horizontal?: boolean;
  grid?: boolean;
  progress?: number;
}

export default function BookCard({ book, onPress, horizontal, grid, progress }: BookCardProps) {
  const formatPrice = (price: number) => {
    return `\u20A6${(price / 100).toLocaleString()}`;
  };

  const cardWidth = grid ? (width - 52) / 2 : horizontal ? 140 : width - 40;
  const imageHeight = grid ? 200 : horizontal ? 200 : 180;

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {book.coverImageUrl ? (
        <Image
          source={{ uri: book.coverImageUrl }}
          style={[styles.cover, { height: imageHeight }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder, { height: imageHeight }]}>
          <Text style={styles.placeholderText}>{book.title[0]}</Text>
        </View>
      )}

      {progress !== undefined && progress > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.author} numberOfLines={1}>
        {book.author?.penName || 'Unknown'}
      </Text>
      <View style={styles.footer}>
        {book.ratingAverage > 0 && (
          <Text style={styles.rating}>
            ★ {book.ratingAverage.toFixed(1)}
          </Text>
        )}
        <Text style={styles.price}>
          {book.isFree ? 'Free' : formatPrice(book.discountPrice || book.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 0,
  },
  cover: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 1.5,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 18,
  },
  author: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
