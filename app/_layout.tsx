import { useEffect, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AlertsProvider } from '@/context/AlertsContext';
import Head from 'expo-router/head';
import { Platform } from 'react-native';
import { 
  registerForegroundService,
  registerBackgroundHandler,
  createNotificationChannels
} from '@/services/notifeeService';
import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';

// Register Notifee foreground service as early as possible
if (Platform.OS === 'android') {
  try {
    // Setup notification channels first
    createNotificationChannels().catch(error => 
      console.error('[Layout] Failed to create notification channels:', error)
    );
    
    // Register services
    registerForegroundService();
    registerBackgroundHandler();
  } catch (error) {
    console.error('[Layout] Error setting up Android notifications:', error);
  }
}

// Prevent the splash screen from auto-hiding until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree
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

  return (
    <ThemeProvider>
      {Platform.OS === 'web' && (
        <Head>
          <title>NadoBeep Web - Tornado in the US? Beep beep!
          </title>
        </Head>
      )}
      <AlertsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AlertsProvider>
    </ThemeProvider>
  );
}