import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { libraryAPI } from '../lib/api';
import { LibraryItem } from '../types';
import BookCard from '../components/BookCard';
import { COLORS } from '../lib/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TABS = ['All', 'Audiobooks', 'Ebooks', 'In Progress'];

export default function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchLibrary = async () => {
    try {
      const response = await libraryAPI.getMyLibrary();
      setLibrary(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching library:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLibrary();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLibrary();
    setRefreshing(false);
  };

  const filteredLibrary = library.filter((item) => {
    switch (activeTab) {
      case 'Audiobooks':
        return item.book.bookType === 'audiobook' || item.book.bookType === 'both';
      case 'Ebooks':
        return item.book.bookType === 'ebook' || item.book.bookType === 'both';
      case 'In Progress':
        return item.listeningProgress && item.listeningProgress.positionSeconds > 0;
      default:
        return true;
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Library</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredLibrary}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => (
            <BookCard
              book={item.book}
              onPress={() =>
                navigation.navigate('BookDetail', {
                  bookId: item.bookId,
                  slug: item.book.slug,
                })
              }
              grid
              progress={
                item.listeningProgress
                  ? item.listeningProgress.positionSeconds
                  : undefined
              }
            />
          )}
          contentContainerStyle={styles.bookGrid}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Your library is empty</Text>
              <Text style={styles.emptyText}>
                Purchase or subscribe to start building your collection
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() =>
                  navigation.navigate('Main', {
                    screen: 'Browse',
                    params: undefined,
                  })
                }
              >
                <Text style={styles.browseBtnText}>Browse Books</Text>
              </TouchableOpacity>
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
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  loader: {
    flex: 1,
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
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
