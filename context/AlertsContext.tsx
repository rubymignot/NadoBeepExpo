import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from '@/types/alerts';
import { stopAlarmSound } from '@/services/soundService';
import { startForegroundService, stopForegroundService, checkAlertsNow, isServiceHealthy, checkAndRestartServices, startAlertServices, stopAlertServices } from '@/services/foregroundService';
import { AppState, Platform } from 'react-native';
// Import web notification functions
import { requestNotificationPermission, isBrowserNotificationSupported } from '@/services/webNotificationService';

// Define the initial state
const initialState = {
  alerts: [],
  isSoundEnabled: true, // changed from soundEnabled to isSoundEnabled
  soundVolume: 0.8,
  notificationsEnabled: true,
};

// Define the context type
type AlertsContextType = {
  state: typeof initialState;
  dispatch: React.Dispatch<{ type: string; payload: any }>;
  toggleSound: () => Promise<boolean>;
  setSoundVolume: (volume: number) => Promise<boolean>;
  toggleNotifications: () => Promise<boolean>;
};

// Reducer for state updates
const alertsReducer = (state: typeof initialState, action: { type: string; payload: any }) => {
  switch (action.type) {
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'SET_SOUND_ENABLED':
      return { ...state, isSoundEnabled: action.payload }; // changed to isSoundEnabled
    case 'SET_SOUND_VOLUME':
      return { ...state, soundVolume: action.payload };
    case 'SET_NOTIFICATIONS_ENABLED':
      return { ...state, notificationsEnabled: action.payload };
    default:
      return state;
  }
};

// Create the context
const AlertsContext = createContext<AlertsContextType | null>(null);

// Provider component
export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(alertsReducer, initialState);

  // Initialize settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Use isSoundEnabled as storage key to match state property name
        const soundEnabled = await AsyncStorage.getItem('isSoundEnabled');
        if (soundEnabled !== null) {
          dispatch({ type: 'SET_SOUND_ENABLED', payload: JSON.parse(soundEnabled) });
        }

        const soundVolume = await AsyncStorage.getItem('soundVolume');
        if (soundVolume !== null) {
          dispatch({ type: 'SET_SOUND_VOLUME', payload: JSON.parse(soundVolume) });
        }

        const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
        if (notificationsEnabled !== null) {
          dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: JSON.parse(notificationsEnabled) });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Set up foreground service when component mounts or notification status changes
  useEffect(() => {
    const updateServices = async () => {
      try {
        // Start or stop the services based on notification status
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          if (state.notificationsEnabled) {
            console.log('[AlertsContext] Starting alert services');
            await startAlertServices();
            
            // Immediately check for alerts when enabling
            checkAlertsNow().catch(err => 
              console.warn('[AlertsContext] Failed immediate alert check:', err)
            );
          } else {
            console.log('[AlertsContext] Stopping alert services');
            await stopAlertServices();
          }
        }
      } catch (error) {
        console.error('[AlertsContext] Error updating services:', error);
      }
    };
    
    updateServices();
    
    // Initial fetch of alerts
    fetchAlerts();
    
    // Set up interval for fetching alerts when app is in foreground
    const intervalId = setInterval(fetchAlerts, 30000);
    
    // Set up app state change listener
    const subscription = AppState.addEventListener('change', (nextAppState: string) => {
      if (nextAppState === 'active' && state.notificationsEnabled) {
        // App came to foreground - check alerts and service health
        console.log('[AlertsContext] App active, checking services');
        checkAndRestartServices().catch((err: any) => 
          console.error('[AlertsContext] Error checking services on resume:', err)
        );
      }
    });
    
    // Set up periodic health check
    let healthCheckId: ReturnType<typeof setInterval> | null = null;
    if ((Platform.OS === 'android' || Platform.OS === 'ios') && state.notificationsEnabled) {
      healthCheckId = setInterval(() => {
        checkAndRestartServices().catch((err: any) => 
          console.error('[AlertsContext] Error in health check:', err)
        );
      }, 60000); // Every minute
    }
    
    return () => {
      clearInterval(intervalId);
      if (healthCheckId) clearInterval(healthCheckId);
      subscription.remove();
    };
  }, [state.notificationsEnabled]);

  // Fetch alerts from NWS API
  const fetchAlerts = async () => {
    try {
      // Implement your alert fetching logic here
      // This would typically fetch from a weather API and update the alerts state
      console.log('[AlertsContext] Fetching alerts');
    } catch (error) {
      console.error('[AlertsContext] Error fetching alerts:', error);
    }
  };

  // Filter alerts based on criteria
  const filterAlerts = async (alerts: Alert[]): Promise<Alert[]> => {
    // Implement your alert filtering logic here
    return alerts;
  };

  // Mark an alert as seen
  const markAlertSeen = async (alertId: string) => {
    try {
      // Get current seen alerts
      const seenAlertsString = await AsyncStorage.getItem('seenAlerts');
      const seenAlerts = seenAlertsString ? seenAlertsString.split('|') : [];
      
      // Add this alert if not already there
      if (!seenAlerts.includes(alertId)) {
        seenAlerts.push(alertId);
        await AsyncStorage.setItem('seenAlerts', seenAlerts.join('|'));
      }
      
      return true;
    } catch (error) {
      console.error('[AlertsContext] Error marking alert as seen:', error);
      return false;
    }
  };

  // Toggle sound on/off
  const toggleSound = async () => {
    try {
      const newSoundEnabled = !state.isSoundEnabled; // changed from soundEnabled
      
      // Update state
      dispatch({ type: 'SET_SOUND_ENABLED', payload: newSoundEnabled });
      
      // Save to storage with the key matching state property name
      await AsyncStorage.setItem('isSoundEnabled', JSON.stringify(newSoundEnabled));
      
      // Stop sound if disabling
      if (!newSoundEnabled) {
        stopAlarmSound();
      }
      
      return true;
    } catch (error) {
      console.error('[AlertsContext] Error toggling sound:', error);
      return state.isSoundEnabled; // changed from soundEnabled
    }
  };

  // Set sound volume
  const setSoundVolume = async (volume: number) => {
    try {
      // Update state
      dispatch({ type: 'SET_SOUND_VOLUME', payload: volume });
      
      // Save to storage
      await AsyncStorage.setItem('soundVolume', JSON.stringify(volume));
      
      return true;
    } catch (error) {
      console.error('[AlertsContext] Error setting sound volume:', error);
      return false;
    }
  };

  // Toggle notifications
  const toggleNotifications = async () => {
    try {
      const newNotificationsEnabled = !state.notificationsEnabled;
      
      // Update state first for faster UI response
      dispatch({ type: 'SET_NOTIFICATIONS_ENABLED', payload: newNotificationsEnabled });
      
      // Save to storage
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newNotificationsEnabled));
      
      // Update services based on new status
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        if (newNotificationsEnabled) {
          await startAlertServices();
          // Immediately check for alerts
          checkAlertsNow();
        } else {
          await stopAlertServices();
        }
      } else if (Platform.OS === 'web' && isBrowserNotificationSupported()) {
        // Handle web notifications
        if (newNotificationsEnabled) {
          // Request permission if needed for web
          await requestNotificationPermission();
          // Start web polling
          await startAlertServices();
          // Check for alerts immediately
          await checkAlertsNow();
        } else {
          // Stop web polling
          await stopAlertServices();
        }
      }
      
      return newNotificationsEnabled;
    } catch (error) {
      console.error('[AlertsContext] Error toggling notifications:', error);
      return state.notificationsEnabled;
    }
  };

  return (
    <AlertsContext.Provider value={{ 
      state, 
      dispatch, 
      toggleSound, 
      setSoundVolume, 
      toggleNotifications
    }}>
      {children}
    </AlertsContext.Provider>
  );
};

// Custom hook to use the AlertsContext
export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};