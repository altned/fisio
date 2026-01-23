import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store/auth';
import { Colors } from '@/constants/Colors';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

const { width, height } = Dimensions.get('window');

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <OnboardingProvider>
      <RootLayoutNav />
    </OnboardingProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Use shared context for onboarding state
  const { isLoading, hasCompletedOnboarding } = useOnboarding();

  // Splash screen animation
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useSharedValue(1);

  const hideSplash = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Combined ready state
  const isReady = !isLoading;

  // Handle Splash Screen: Only hide when context is ready
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();

      setTimeout(() => {
        splashOpacity.value = withTiming(0, { duration: 800 }, (finished) => {
          if (finished) runOnJS(hideSplash)();
        });
      }, 500);
    }
  }, [isReady]);

  const animatedSplashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  // NAVIGATION GUARD - Uses shared context state
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    console.log('[Guard] State:', { hasCompletedOnboarding, isLoggedIn, segment: segments[0] });

    // 1. If NOT completed onboarding -> Force Onboarding
    if (!hasCompletedOnboarding) {
      if (!inOnboarding) {
        console.log('[Guard] Redirecting to Onboarding');
        router.replace('/onboarding');
      }
      return;
    }

    // 2. If completed onboarding but still in onboarding screen -> Leave
    if (inOnboarding && hasCompletedOnboarding) {
      console.log('[Guard] Leaving Onboarding (Completed)');
      router.replace(isLoggedIn ? '/(tabs)' : '/(auth)/login');
      return;
    }

    // 3. Auth Logic
    if (inAuthGroup && isLoggedIn) {
      router.replace('/(tabs)');
    } else if (!isLoggedIn && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/login');
    }

  }, [isReady, hasCompletedOnboarding, isLoggedIn, segments]);

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
    <View style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? darkTheme : lightTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[bookingId]" />
          <Stack.Screen name="session-complete" />
          <Stack.Screen name="review" />
          <Stack.Screen name="profile-edit" />
          <Stack.Screen name="notification-settings" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
      {showSplash && (
        <Animated.View style={[styles.splashContainer, animatedSplashStyle]}>
          <Image
            source={require('../assets/images/splash.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  splashImage: {
    width: width * 0.85,
    height: height * 0.5,
  },
});
