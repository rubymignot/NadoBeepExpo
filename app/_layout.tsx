import { useEffect, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AlertsProvider } from '@/context/AlertsContext';
import { initializeAudio } from '@/services/soundService';
import { Platform, AppState } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  startAlertServices, 
  checkAlertsNow, 
  checkAndRestartServices 
} from '@/services/foregroundService';
import { 
  registerForegroundService,
  registerBackgroundHandler,
  createNotificationChannels
} from '@/services/notifeeService';

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

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const notificationListener = useRef<any>();
  const serviceInitialized = useRef(false);
  const appStateSubscription = useRef<any>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize audio system
        await initializeAudio();

        // Initialize services if not already done
        if (!serviceInitialized.current && Platform.OS === 'android') {
          try {
            const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
            
            if (notificationsEnabled === 'true') {
              console.log('[Layout] Starting alert services');
              
              // Create notification channels
              await createNotificationChannels();
              
              // Start the services
              await startAlertServices();
              serviceInitialized.current = true;
              
              // Do an initial check for alerts with a short delay
              setTimeout(() => {
                checkAlertsNow().catch(err => 
                  console.warn('[Layout] Initial alert check failed:', err)
                );
              }, 2000);
            }
          } catch (error) {
            console.error('[Layout] Error initializing Android services:', error);
          }
        }
        
        // Set up AppState listener to monitor app foreground/background transitions
        appStateSubscription.current = AppState.addEventListener('change', nextAppState => {
          console.log('[Layout] App state changed:', nextAppState);
          
          if (nextAppState === 'active') {
            // App came to foreground - check services and restart if needed
            checkAndRestartServices().catch(err => 
              console.error('[Layout] Error checking services on resume:', err)
            );
          }
        });
      } catch (error) {
        console.error('[Layout] Error initializing app services:', error);
      }
    };

    initializeApp();

    return () => {
      // Clean up notification listener
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      
      // Clean up AppState listener
      if (appStateSubscription.current) {
        appStateSubscription.current.remove();
      }
    };
  }, [router]);

  // Set up periodic health check
  useEffect(() => {
    let healthCheckId: NodeJS.Timeout | null = null;
    
    if (Platform.OS === 'android') {
      healthCheckId = setInterval(() => {
        AsyncStorage.getItem('notificationsEnabled')
          .then(enabled => {
            if (enabled === 'true') {
              checkAndRestartServices().catch(error => 
                console.error('[Layout] Health check failed:', error)
              );
            }
          })
          .catch(error => 
            console.error('[Layout] Error checking notification setting:', error)
          );
      }, 60000); // Check every minute
    }
    
    return () => {
      if (healthCheckId) clearInterval(healthCheckId);
    };
  }, []);

  return (
    <AlertsProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AlertsProvider>
  );
}
