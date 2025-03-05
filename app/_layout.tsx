import { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { AlertsProvider } from '../context/AlertsContext';
import { BackgroundTaskProvider } from '../context/BackgroundTaskContext';
import { setNotificationCategories } from '../utils/notificationCategories';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set up notification handler for the entire app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Setup notifications and background tasks on app startup
  useEffect(() => {
    async function setupNotifications() {
      try {
        // Request permissions
        if (Platform.OS !== 'web') {
          // Request full notification permissions
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowCriticalAlerts: true,
              provideAppNotificationSettings: true,
              allowProvisional: true
            },
            android: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true, 
              allowAnnouncements: true,
              priority: 'max',
              importance: Notifications.AndroidImportance.MAX
            }
          });
          
          console.log(`[App] Notification permission status: ${status}`);
          
          // Set up notification categories for actionable notifications
          await setNotificationCategories();
        }
      } catch (e) {
        console.error('[App] Error setting up notifications:', e);
      }
    }
    
    setupNotifications();
  }, []);

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
  return (
    <BackgroundTaskProvider>
      <AlertsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AlertsProvider>
    </BackgroundTaskProvider>
  );
}