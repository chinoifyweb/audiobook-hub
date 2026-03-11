import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { booksAPI } from '../lib/api';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import CategoryChip from '../components/CategoryChip';
import { COLORS, GENRES } from '../lib/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BrowseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (searchQuery) params.search = searchQuery;
      if (selectedGenre) params.genre = selectedGenre;
      const response = await booksAPI.getAll(params);
      setBooks(response.data?.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGenre, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre);
    setPage(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Books</Text>
        <SearchBar
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setPage(1);
          }}
          placeholder="Search audiobooks..."
        />
      </View>

      <FlatList
        horizontal
        data={GENRES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <CategoryChip
            label={item}
            selected={selectedGenre === item}
            onPress={() => handleGenreSelect(item)}
          />
        )}
        contentContainerStyle={styles.genreList}
        style={styles.genreContainer}
      />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              onPress={() =>
                navigation.navigate('BookDetail', {
                  bookId: item.id,
                  slug: item.slug,
                })
              }
              grid
            />
          )}
          contentContainerStyle={styles.bookGrid}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No books found</Text>
            </View>
          }
        />
      )}
    </View>
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  genreContainer: {
    maxHeight: 44,
  },
  genreList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  bookGrid: {
    padding: 20,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
});
