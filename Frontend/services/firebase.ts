import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';

/**
 * Firebase initialization for Estoria (Expo / React Native).
 *
 * Config comes from EXPO_PUBLIC_* env vars (same pattern as services/tmdb.ts).
 * Firebase web config is not a secret, but env vars keep one place to swap
 * per environment (dev / staging / prod) without code changes.
 */

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function readConfig(): FirebaseConfig {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  };

  const missing = Object.entries(config)
    .filter(([, value]) => value.length === 0)
    .map(([key]) => key);

  if (missing.length > 0) {
    // Fail fast and loudly: a half-configured Firebase app fails later at
    // first request with an opaque network error otherwise.
    throw new Error(
      `Firebase is not configured. Missing env vars: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in the Firebase web app config.',
    );
  }

  return config;
}

let appInstance: FirebaseApp | null = null;

/** Lazily initialized so import-time config errors surface inside the app. */
export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(readConfig());
  }
  return appInstance;
}

let authInstance: Auth | null = null;

// Firebase 13 exposes this adapter at runtime for React Native, although its
// TypeScript declarations do not include it in the main auth entry point.
const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
  }
).getReactNativePersistence;

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getFirebaseApp();
    try {
      // Native sessions survive app restarts through AsyncStorage. The
      // browser adapter accesses localStorage and is used only on web.
      authInstance =
        Platform.OS === 'web'
          ? initializeAuth(app, { persistence: browserLocalPersistence })
          : initializeAuth(app, {
              persistence: getReactNativePersistence(AsyncStorage),
            });

      if (useEmulators()) {
        connectAuthEmulator(authInstance, `http://${emulatorHost()}:9099`);
      }
    } catch (error) {
      // Fast Refresh can leave an Auth instance registered for this app.
      // Only recover from that known initialization race; other failures
      // must remain visible instead of becoming a misleading auth state.
      if (isAuthAlreadyInitializedError(error)) {
        authInstance = getAuth(app);
      } else {
        throw error;
      }
    }
  }
  return authInstance;
}

function isAuthAlreadyInitializedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const message = 'message' in error ? error.message : undefined;
  return (
    code === 'auth/already-initialized' ||
    (typeof message === 'string' && message.includes('already-initialized'))
  );
}

let dbInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
    if (useEmulators()) {
      connectFirestoreEmulator(dbInstance, emulatorHost(), 8080);
    }
  }
  return dbInstance;
}

let functionsInstance: Functions | null = null;

export function getFunctionsClient(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(getFirebaseApp());
    if (useEmulators()) {
      connectFunctionsEmulator(functionsInstance, emulatorHost(), 5001);
    }
  }
  return functionsInstance;
}

/** Local emulator suite (firebase emulators:start in Backend/). */
function useEmulators(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
}

function emulatorHost(): string {
  return process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? 'localhost';
}
