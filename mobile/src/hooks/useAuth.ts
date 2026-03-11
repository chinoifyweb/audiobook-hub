import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, restoreSession } =
    useAuthStore();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await login(
            {
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || '',
              avatarUrl: session.user.user_metadata?.avatar_url,
              role: session.user.user_metadata?.role || 'customer',
              isVerified: !!session.user.email_confirmed_at,
            },
            session.access_token
          );
        } else if (event === 'SIGNED_OUT') {
          await logout();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    restoreSession,
  };
}
