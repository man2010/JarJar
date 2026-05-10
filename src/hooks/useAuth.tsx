import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { AppUser as User, Profile } from '../lib/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = !!(profile?.role === 'admin' || (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, email?: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      if (email && ADMIN_EMAILS.includes(email.toLowerCase()) && data.role !== 'admin') {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
        data.role = 'admin';
      }
      setProfile(data);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }

  async function refreshProfile() {
    if (!user) return;
    await fetchProfile(user.id, user.email);
  }

  async function signUp(email: string, password: string, username: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, fullName } },
    });
    if (error) return { error: error.message };

    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id, data.user.email);
    }

    return { error: null };
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error.message };
    }
    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id, data.user.email);
    } else {
      setLoading(false);
    }
    return { error: null };
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut({ scope: 'global' });
    setUser(null);
    setProfile(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
