export const API_URL = __DEV__
  ? 'http://192.168.1.100:3000' // Update with local IP
  : 'https://audiobooks.com.ng';

export const SUPABASE_URL = 'https://oplcyaickhqperpohdut.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbGN5YWlja2hxcGVycG9oZHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MzczNzcsImV4cCI6MjA1NzIxMzM3N30.XNPJbSYB7P2TdR91FeNivEbOsGn7oflQSG6giBvIPI8';

export const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#f59e0b',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  border: '#334155',
  white: '#ffffff',
  black: '#000000',
};

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const GENRES = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance',
  'Science Fiction', 'Fantasy', 'Biography', 'Self-Help', 'Business',
  'History', 'Children', 'Young Adult', 'Horror', 'Poetry',
];
