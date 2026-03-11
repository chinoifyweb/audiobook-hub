import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { booksAPI, purchaseAPI } from '../lib/api';
import { Book, AudioFile } from '../types';
import { COLORS } from '../lib/constants';

const { width } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BookDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp>();
  const { bookId, slug } = route.params;
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await booksAPI.getBySlug(slug || bookId);
        setBook(response.data?.book || null);
        setChapters(response.data?.chapters || []);
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId, slug]);

  const handlePlay = () => {
    navigation.navigate('Player', { bookId });
  };

  const handlePurchase = async () => {
    if (!book) return;
    try {
      if (book.isFree) {
        await purchaseAPI.getFree(book.id);
      } else {
        const response = await purchaseAPI.initialize(book.id);
        // Handle Paystack payment URL
        console.log('Payment initialized:', response.data);
      }
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  const formatPrice = (price: number) => {
    return `\u20A6${(price / 100).toLocaleString()}`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    );
  }

  const totalDuration = chapters.reduce((sum, ch) => sum + ch.durationSeconds, 0);

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        {book.coverImageUrl ? (
          <Image
            source={{ uri: book.coverImageUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>{book.title[0]}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>by {book.author?.penName || 'Unknown'}</Text>

        {/* Rating & Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoLabel}>
              {'★'.repeat(Math.round(book.ratingAverage))} {book.ratingAverage.toFixed(1)}
            </Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoLabel}>{book.genre}</Text>
          </View>
          {totalDuration > 0 && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoLabel}>{formatDuration(totalDuration)}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyButton} onPress={handlePurchase}>
            <Text style={styles.buyButtonText}>
              {book.isFree ? 'Get Free' : `Buy ${formatPrice(book.price)}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{book.description}</Text>
        </View>

        {/* Chapters */}
        {chapters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Chapters ({chapters.length})
            </Text>
            {chapters.map((chapter, index) => (
              <View key={chapter.id} style={styles.chapterItem}>
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterNumber}>{index + 1}</Text>
                  <Text style={styles.chapterTitle}>{chapter.chapterTitle}</Text>
                </View>
                <Text style={styles.chapterDuration}>
                  {formatDuration(chapter.durationSeconds)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  coverContainer: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 24,
  },
  coverImage: {
    width: width * 0.55,
    height: width * 0.55 * 1.5,
    borderRadius: 12,
  },
  coverPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  author: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  infoBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  playButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  playButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buyButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chapterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chapterNumber: {
    color: COLORS.textMuted,
    fontSize: 14,
    width: 28,
  },
  chapterTitle: {
    color: COLORS.text,
    fontSize: 15,
    flex: 1,
  },
  chapterDuration: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
