import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
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

// Prevent the splash screen from auto-hiding until fonts have loaded.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Route guard: signed-out users always land on the auth screens, and a
 * successful sign-in / sign-up immediately swaps the auth stack for the
 * main tab UI. Runs after auth state settles so a restored session never
 * flashes the login screen.
 */
function AuthGate() {
  const { account, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
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

function RootLayoutNav() {
  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerBackTitle: 'Back', contentStyle: { backgroundColor: '#0C0D10' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="movie/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <StatusBar style="light" />
                <ErrorBoundary>
                  <RootLayoutNav />
                </ErrorBoundary>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
