export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'customer' | 'author' | 'admin';
  phone?: string;
  isVerified: boolean;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  coverImageUrl?: string;
  genre: string;
  subGenre?: string;
  language: string;
  price: number;
  discountPrice?: number;
  isFree: boolean;
  bookType: 'ebook' | 'audiobook' | 'both';
  status: string;
  ratingAverage: number;
  ratingCount: number;
  author: {
    id: string;
    penName: string;
  };
}

export interface AudioFile {
  id: string;
  bookId: string;
  chapterNumber: number;
  chapterTitle: string;
  fileUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
  format: string;
  sortOrder: number;
}

export interface LibraryItem {
  id: string;
  bookId: string;
  accessType: 'purchased' | 'subscription';
  addedAt: string;
  lastAccessedAt?: string;
  listeningProgress?: {
    chapter: number;
    positionSeconds: number;
  };
  book: Book;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'quarterly' | 'annually';
  maxBooksPerMonth?: number;
  features: string[];
  isActive: boolean;
}

export interface Review {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  reviewText?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user?: { fullName: string; avatarUrl?: string };
}
