import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter, useSegments } from 'expo-router';
import { FavoritesProvider } from '../../context/FavoritesContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { NetworkProvider } from '../../context/NetworkContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../../components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGuard() {
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

function AppShell() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <AuthProvider>
            <AuthAwareSlot />
          </AuthProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AuthAwareSlot() {
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      SplashScreen.hideAsync();
    }
  }, [authLoading]);

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
