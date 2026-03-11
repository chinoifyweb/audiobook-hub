import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './constants';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/signin', { email, password }),
  signup: (data: { email: string; password: string; fullName: string }) =>
    api.post('/auth/signup', data),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
};

// Books API
export const booksAPI = {
  getAll: (params?: { genre?: string; search?: string; page?: number; sort?: string }) =>
    api.get('/books', { params }),
  getBySlug: (slug: string) => api.get(`/books/${slug}`),
  getFeatured: () => api.get('/books', { params: { featured: true, limit: 10 } }),
  getByGenre: (genre: string) => api.get('/books', { params: { genre, limit: 20 } }),
};

// Library API
export const libraryAPI = {
  getMyLibrary: () => api.get('/library'),
  updateProgress: (bookId: string, progress: any) =>
    api.post('/library/progress', { bookId, ...progress }),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getMySubscription: () => api.get('/subscriptions/current'),
  initialize: (planId: string) => api.post('/subscriptions/initialize', { planId }),
};

// Purchase API
export const purchaseAPI = {
  initialize: (bookId: string) => api.post('/purchases/initialize', { bookId }),
  verify: (reference: string) => api.post('/purchases/verify', { reference }),
  getFree: (bookId: string) => api.post('/purchases/free', { bookId }),
};

export default api;
