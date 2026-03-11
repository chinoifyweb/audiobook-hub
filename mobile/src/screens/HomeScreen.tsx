import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { booksAPI } from '../lib/api';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import { COLORS, GENRES } from '../lib/constants';
import CategoryChip from '../components/CategoryChip';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBooks = async () => {
    try {
      const [featuredRes, recentRes] = await Promise.all([
        booksAPI.getFeatured(),
        booksAPI.getAll({ sort: 'newest', page: 1 }),
      ]);
      setFeaturedBooks(featuredRes.data?.books || []);
      setRecentBooks(recentRes.data?.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.fullName?.split(' ')[0] || 'there'}!
          </Text>
          <Text style={styles.subGreeting}>What would you like to listen to?</Text>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Genre</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={GENRES.slice(0, 8)}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <CategoryChip
              label={item}
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'Browse',
                  params: undefined,
                })
              }
            />
          )}
          contentContainerStyle={styles.chipList}
        />
      </View>

      {/* Featured Books */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'Browse',
                params: undefined,
              })
            }
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={featuredBooks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              onPress={() =>
                navigation.navigate('BookDetail', {
                  bookId: item.id,
                  slug: item.slug,
                })
              }
              horizontal
            />
          )}
          contentContainerStyle={styles.bookList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No featured books yet</Text>
          }
        />
      </View>

      {/* Recent Books */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'Browse',
                params: undefined,
              })
            }
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={recentBooks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              onPress={() =>
                navigation.navigate('BookDetail', {
                  bookId: item.id,
                  slug: item.slug,
                })
              }
              horizontal
            />
          )}
          contentContainerStyle={styles.bookList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No books yet</Text>
          }
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  chipList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  bookList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    paddingHorizontal: 20,
  },
});
