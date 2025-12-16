import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store/auth';
import { Colors } from '@/constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

const ONBOARDING_COMPLETED_KEY = '@fisioku_onboarding_completed';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check onboarding status on mount and when segments change
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        setHasCompletedOnboarding(completed === 'true');
      } catch (e) {
        console.warn('Failed to check onboarding status:', e);
        setHasCompletedOnboarding(true); // Default to completed to not block users
      } finally {
        setIsCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, [segments]); // Re-check when segments change (e.g., after completing onboarding)

  useEffect(() => {
    if (isCheckingOnboarding) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    // Protected routes that logged-in users can access outside of tabs
    const inProtectedRoute = ['chat', 'session-complete', 'review'].includes(segments[0] as string);

    // First-time users go to onboarding
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // Skip if still in onboarding
    if (inOnboarding) return;

    // After onboarding, handle auth redirects
    if (hasCompletedOnboarding) {
      // If logged in and in protected route or tabs, allow access
      if (isLoggedIn && (inTabs || inProtectedRoute)) {
        return; // Already in a valid location
      }

      if (isLoggedIn && !inTabs && !inProtectedRoute) {
        // Logged in but in unknown route -> go to tabs
        router.replace('/(tabs)');
      } else if (!isLoggedIn && !inAuthGroup) {
        // Not logged in and not in auth -> go to login
        router.replace('/(auth)/login');
      }
    }
  }, [isLoggedIn, segments, isCheckingOnboarding, hasCompletedOnboarding]);

  // Custom theme with healthcare colors
  const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.primary,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: Colors.light.border,
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.primary,
      background: Colors.dark.background,
      card: Colors.dark.card,
      text: Colors.dark.text,
      border: Colors.dark.border,
    },
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? darkTheme : lightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[bookingId]" />
        <Stack.Screen name="session-complete" />
        <Stack.Screen name="review" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

