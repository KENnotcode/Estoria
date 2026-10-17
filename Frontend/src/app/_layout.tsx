import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter, useSegments } from 'expo-router';
import { FavoritesProvider } from '../../context/FavoritesContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Prevent the native splash screen from auto-hiding until fonts and auth
// have both settled. This avoids flashing the main UI before the auth guard
// has had a chance to redirect unauthenticated users to /login.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Route guard: signed-out users always land on the auth screens, and a
 * successful sign-in / sign-up immediately swaps the auth stack for the
 * main tab UI. Runs after auth state settles so a restored session never
 * flashes the login screen.
 *
 * Returns null so the root layout can decide whether to render the matched
 * route (<Slot />) or keep showing the splash screen.
 */
function AuthGuard() {
  const { account, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // While Firebase is still restoring the session, hold off — redirecting
    // too early would kick an authenticated user back to /login.
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!account && !inAuthGroup) {
      router.replace('/login');
    } else if (account && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [account, isLoading, segments, router]);

  return null;
}

/**
 * Renders the app chrome (providers, status bar, error boundary) and
 * delegates the actual route to <Slot />. The auth guard runs inside the
 * providers so `useAuth()` is safe here.
 */
function AppShell() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthAwareSlot />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * Waits for Firebase auth to settle, then renders the matched route via
 * <Slot />. While auth is still loading, returns null so the native splash
 * screen remains visible and no UI flashes before the redirect decision.
 */
function AuthAwareSlot() {
  const { isLoading: authLoading } = useAuth();

  // Hide the native splash screen once auth has settled. This is a side
  // effect on an external system, not React state, so it belongs in an
  // effect rather than being derived from state.
  useEffect(() => {
    if (!authLoading) {
      SplashScreen.hideAsync();
    }
  }, [authLoading]);

  // While auth is still being restored, render nothing — the native splash
  // screen keeps the screen from flashing blank or showing the wrong UI.
  if (authLoading) {
    return null;
  }

  return (
    <FavoritesProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style="light" />
          <ErrorBoundary>
            <AuthGuard />
            <Slot />
          </ErrorBoundary>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </FavoritesProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <AppShell />;
}
