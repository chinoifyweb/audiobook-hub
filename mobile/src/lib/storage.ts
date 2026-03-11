// @ts-nocheck - expo-file-system v55 has new API, using legacy compat
import * as LegacyFS from 'expo-file-system/src/legacy/FileSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOAD_DIR = `${LegacyFS.documentDirectory || ''}audiobooks/`;

export const downloadManager = {
  async ensureDir() {
    const dirInfo = await LegacyFS.getInfoAsync(DOWNLOAD_DIR);
    if (!dirInfo.exists) {
      await LegacyFS.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
    }
  },

  getLocalPath(bookId: string, chapterId: string): string {
    return `${DOWNLOAD_DIR}${bookId}/${chapterId}.mp3`;
  },

  async isDownloaded(bookId: string, chapterId: string): Promise<boolean> {
    const path = this.getLocalPath(bookId, chapterId);
    const info = await LegacyFS.getInfoAsync(path);
    return info.exists;
  },

  async downloadChapter(
    bookId: string,
    chapterId: string,
    url: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    await this.ensureDir();
    const bookDir = `${DOWNLOAD_DIR}${bookId}/`;
    const dirInfo = await LegacyFS.getInfoAsync(bookDir);
    if (!dirInfo.exists) {
      await LegacyFS.makeDirectoryAsync(bookDir, { intermediates: true });
    }

    const localPath = this.getLocalPath(bookId, chapterId);

    const downloadResumable = LegacyFS.createDownloadResumable(
      url,
      localPath,
      {},
      (downloadProgress: any) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (result) {
      const downloads = JSON.parse(
        (await AsyncStorage.getItem('downloads')) || '{}'
      );
      if (!downloads[bookId]) downloads[bookId] = [];
      if (!downloads[bookId].includes(chapterId)) {
        downloads[bookId].push(chapterId);
      }
      await AsyncStorage.setItem('downloads', JSON.stringify(downloads));
    }
    return localPath;
  },

  async deleteBook(bookId: string): Promise<void> {
    const bookDir = `${DOWNLOAD_DIR}${bookId}/`;
    const dirInfo = await LegacyFS.getInfoAsync(bookDir);
    if (dirInfo.exists) {
      await LegacyFS.deleteAsync(bookDir, { idempotent: true });
    }
    const downloads = JSON.parse(
      (await AsyncStorage.getItem('downloads')) || '{}'
    );
    delete downloads[bookId];
    await AsyncStorage.setItem('downloads', JSON.stringify(downloads));
  },

  async getDownloadedBooks(): Promise<string[]> {
    const downloads = JSON.parse(
      (await AsyncStorage.getItem('downloads')) || '{}'
    );
    return Object.keys(downloads);
  },

  async getStorageUsed(): Promise<number> {
    await this.ensureDir();
    const dirInfo = await LegacyFS.getInfoAsync(DOWNLOAD_DIR);
    return dirInfo.exists ? ((dirInfo as any).size || 0) : 0;
  },
};
