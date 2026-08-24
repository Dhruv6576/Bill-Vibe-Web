import { supabaseSync } from '../services/supabaseSync';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../types';
import { storageService } from '../services/storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profileData: Profile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Business Owner',
              avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
              created_at: session.user.created_at,
            };
            setUser(profileData);
            supabaseSync.syncProfile(profileData);
          } else {
            // Default demo session
            setUser(storageService.getCurrentUser());
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
            const profileData: Profile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Business Owner',
              avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
              created_at: session.user.created_at,
            };
            setUser(profileData);
            supabaseSync.syncProfile(profileData);
          } else {
              setUser(null);
            }
          });

          return () => subscription.unsubscribe();
        } else {
          // Local offline/demo auth
          const currentUser = storageService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(storageService.getCurrentUser());
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
      } else {
        // Fallback simulate instant Google login
        const demoUser: Profile = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'dhruv@shreehari.com',
          full_name: 'Dhruv Patel',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          created_at: new Date().toISOString(),
        };
        storageService.setCurrentUser(demoUser);
        setUser(demoUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
      } else {
        const demoUser: Profile = {
          id: '00000000-0000-0000-0000-000000000001',
          email: email.trim(),
          full_name: email.split('@')[0].toUpperCase(),
          created_at: new Date().toISOString(),
        };
        storageService.setCurrentUser(demoUser);
        setUser(demoUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (data: Partial<Profile>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      storageService.setCurrentUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
