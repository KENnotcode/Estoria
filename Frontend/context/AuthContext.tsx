import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const ACCOUNT_KEY = '@estoria/account';
const SESSION_KEY = '@estoria/session';

export type Account = {
  name: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  account: Account | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const [storedAccount, session] = await Promise.all([
          AsyncStorage.getItem(ACCOUNT_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        if (mounted && storedAccount && session === 'active') {
          setAccount(JSON.parse(storedAccount) as Account);
        }
      } catch {
        // A corrupt local session should behave like a signed-out session.
        if (mounted) setAccount(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const storedAccount = await AsyncStorage.getItem(ACCOUNT_KEY);
    if (!storedAccount) {
      throw new Error('No account exists for this device yet. Create one first.');
    }

    const savedAccount = JSON.parse(storedAccount) as Account;
    if (savedAccount.email.toLowerCase() !== email.trim().toLowerCase() || savedAccount.password !== password) {
      throw new Error('That email and password do not match.');
    }

    await AsyncStorage.setItem(SESSION_KEY, 'active');
    setAccount(savedAccount);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existingAccount = await AsyncStorage.getItem(ACCOUNT_KEY);
    if (existingAccount) {
      const savedAccount = JSON.parse(existingAccount) as Account;
      if (savedAccount.email === normalizedEmail) {
        throw new Error('An account with this email already exists.');
      }
      throw new Error('This preview supports one local account. Sign in with the saved account instead.');
    }

    const nextAccount = { name: name.trim(), email: normalizedEmail, password };
    await AsyncStorage.multiSet([
      [ACCOUNT_KEY, JSON.stringify(nextAccount)],
      [SESSION_KEY, 'active'],
    ]);
    setAccount(nextAccount);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setAccount(null);
  }, []);

  const value = useMemo(() => ({ account, isLoading, signIn, signUp, signOut }), [account, isLoading, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
