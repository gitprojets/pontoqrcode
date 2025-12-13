import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  unidade: string | null;
  unidade_id: string | null;
  foto: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache to prevent duplicate fetches
let profileCache: { [userId: string]: { profile: Profile | null; role: AppRole | null; timestamp: number } } = {};
const CACHE_TTL = 60000; // 1 minute cache

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const fetchProfile = useCallback(async (userId: string, forceRefresh = false) => {
    // Check cache first
    const cached = profileCache[userId];
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setProfile(cached.profile);
      setRole(cached.role);
      return;
    }

    // Prevent duplicate fetches
    if (isFetching) return;
    setIsFetching(true);

    try {
      // Fetch profile and role in parallel
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        supabase.rpc('get_user_role', { _user_id: userId })
      ]);

      const newProfile = profileResult.data;
      const newRole = roleResult.data;

      // Update cache
      profileCache[userId] = {
        profile: newProfile,
        role: newRole,
        timestamp: Date.now()
      };

      setProfile(newProfile);
      setRole(newRole);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, true);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Defer profile fetch with setTimeout to avoid deadlock
          setTimeout(() => {
            if (mounted) fetchProfile(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRole(null);
          // Clear cache on logout
          profileCache = {};
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    profileCache = {}; // Clear cache
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    role,
    isAuthenticated: !!session,
    isLoading,
    logout,
    refreshProfile
  }), [user, session, profile, role, isLoading, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
