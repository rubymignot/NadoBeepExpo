import { useEffect, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AlertsProvider } from '@/context/AlertsContext';
import { configureNotifications, setupNotificationListeners, getLastNotificationResponse } from '@/services/notificationService';
import { initializeAudio } from '@/services/soundService';
import { Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const notificationListener = useRef<any>();

  useEffect(() => {
    // Initialize audio system
    initializeAudio();

    // Configure notifications (skips on web)
    configureNotifications();

    // Set up notification listeners (returns dummy for web)
    notificationListener.current = setupNotificationListeners();

    // Handle notification taps from background/killed state
    if (Platform.OS !== 'web') {
      getLastNotificationResponse().then(response => {
        if (response) {
          const alertId = response.notification.request.content.data?.id;
          if (alertId) {
            // Navigate to alert details screen
            AsyncStorage.setItem('lastTappedAlertId', alertId.toString());
            
            // Delay navigation to ensure app is fully loaded
            setTimeout(() => router.push({
              pathname: '/(tabs)/alert-details',
              params: { alertId: alertId }
            }), 1000);
          }
        }
      });

      // Check for stored alert ID from previous notification tap
      AsyncStorage.getItem('lastTappedAlertId').then(storedAlertId => {
        if (storedAlertId) {
          // Navigate to alert details and clear the stored ID
          router.push({
            pathname: '/(tabs)/alert-details',
            params: { alertId: storedAlertId }
          });
          AsyncStorage.removeItem('lastTappedAlertId');
        }
      });
    }

    return () => {
      // Clean up notification listener
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, [router]);

  return (
    <AlertsProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AlertsProvider>
  );
}