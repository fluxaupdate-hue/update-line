import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types';
import { isMinor, needsParentalConsent as computeNeedsParentalConsent } from '../types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: boolean;
  isMinorUser: boolean;
  needsParentalConsent: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Distinct de `loading` (session) : suit précisément si la lecture du profil est en cours,
  // et si elle a échoué, pour ne jamais laisser quelqu'un bloqué sur un écran de chargement
  // infini sans échappatoire (ex: profil manquant suite à une inscription interrompue).
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  async function loadProfile(userId: string) {
    setProfileLoading(true);
    setProfileError(false);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setProfile(data as Profile);
    } else {
      setProfile(null);
      setProfileError(true);
    }
    setProfileLoading(false);
  }

  async function refreshProfile() {
    if (session?.user?.id) await loadProfile(session.user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) {
        loadProfile(data.session.user.id);
      } else {
        setProfileLoading(false);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
        setProfileError(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const minorUser = isMinor(profile?.date_naissance ?? null);

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    profileLoading,
    profileError,
    isMinorUser: minorUser,
    // Un mineur ne doit avoir aucun accès fonctionnel tant que le consentement parental
    // n'a pas été validé par le centre — voir PendingConsentPage. Logique testée dans
    // src/test/needsParentalConsent.test.ts.
    needsParentalConsent: computeNeedsParentalConsent(profile),
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  return ctx;
}
