import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from '@/types/alerts';
import { stopAlarmSound } from '@/services/soundService';
import { startForegroundService, stopForegroundService, checkAlertsNow, isServiceHealthy, checkAndRestartServices, startAlertServices, stopAlertServices } from '@/services/foregroundService';
import { AppState, Platform } from 'react-native';
// Import web notification functions
import { requestNotificationPermission, isBrowserNotificationSupported } from '@/services/webNotificationService';
import { FILTERED_ALERT_TYPES } from '@/constants/alerts';

// Define the initial state
const initialState = {
  alerts: [],
  isSoundEnabled: true, // We'll keep this for backward compatibility but won't expose it in UI
  soundVolume: 0.8,
  notificationsEnabled: true,
  enabledAlertTypes: [] as string[], // Add state for enabled alert types
  alarmEnabledAlertTypes: [] as string[], // Add state for alarm-enabled alert types
};

// Define the context type
type AlertsContextType = {
  state: typeof initialState;
  dispatch: React.Dispatch<{ type: string; payload: any }>;
  toggleSound: () => Promise<boolean>;
  setSoundVolume: (volume: number) => Promise<boolean>;
  toggleNotifications: () => Promise<boolean>;
  toggleAlertType: (alertType: string) => Promise<boolean>;
  isAlertTypeEnabled: (alertType: string) => boolean;
  toggleAllAlertTypes: (enabled: boolean) => Promise<boolean>;
  toggleAlarmForAlertType: (alertType: string) => Promise<boolean>;
  isAlarmEnabledForAlertType: (alertType: string) => boolean;
  toggleAlarmForAllAlertTypes: (enabled: boolean) => Promise<boolean>;
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
    case 'SET_ENABLED_ALERT_TYPES':
      return { ...state, enabledAlertTypes: action.payload };
    case 'SET_ALARM_ENABLED_ALERT_TYPES':
      return { ...state, alarmEnabledAlertTypes: action.payload };
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

        // Load enabled alert types or set defaults
        const enabledAlertTypes = await AsyncStorage.getItem('enabledAlertTypes');
        if (enabledAlertTypes !== null) {
          dispatch({ type: 'SET_ENABLED_ALERT_TYPES', payload: JSON.parse(enabledAlertTypes) });
        } else {
          // Default to all alert types enabled
          dispatch({ type: 'SET_ENABLED_ALERT_TYPES', payload: [...FILTERED_ALERT_TYPES] });
          await AsyncStorage.setItem('enabledAlertTypes', JSON.stringify(FILTERED_ALERT_TYPES));
        }

        // Load alarm-enabled alert types or set defaults (only tornado warnings by default)
        const alarmEnabledAlertTypes = await AsyncStorage.getItem('alarmEnabledAlertTypes');
        if (alarmEnabledAlertTypes !== null) {
          dispatch({ type: 'SET_ALARM_ENABLED_ALERT_TYPES', payload: JSON.parse(alarmEnabledAlertTypes) });
        } else {
          // Default to only tornado warnings for alarm
          const defaultAlarmTypes = FILTERED_ALERT_TYPES.filter(type => 
            type === 'Tornado Warning' || type === 'Test Tornado Warning'
          );
          dispatch({ type: 'SET_ALARM_ENABLED_ALERT_TYPES', payload: defaultAlarmTypes });
          await AsyncStorage.setItem('alarmEnabledAlertTypes', JSON.stringify(defaultAlarmTypes));
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

  // Toggle sound on/off - keep this function, but we won't expose it in the UI
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

  // Check if an alert type is enabled
  const isAlertTypeEnabled = (alertType: string): boolean => {
    return state.enabledAlertTypes.includes(alertType);
  };

  // Toggle an individual alert type
  const toggleAlertType = async (alertType: string): Promise<boolean> => {
    try {
      const updatedEnabledTypes = [...state.enabledAlertTypes];
      
      if (updatedEnabledTypes.includes(alertType)) {
        // Remove the alert type
        const index = updatedEnabledTypes.indexOf(alertType);
        updatedEnabledTypes.splice(index, 1);
      } else {
        // Add the alert type
        updatedEnabledTypes.push(alertType);
      }
      
      // Update state
      dispatch({ type: 'SET_ENABLED_ALERT_TYPES', payload: updatedEnabledTypes });
      
      // Save to storage
      await AsyncStorage.setItem('enabledAlertTypes', JSON.stringify(updatedEnabledTypes));
      
      return true;
    } catch (error) {
      console.error('[AlertsContext] Error toggling alert type:', error);
      return false;
    }
  };

  // Toggle all alert types at once
  const toggleAllAlertTypes = async (enabled: boolean): Promise<boolean> => {
    try {
      const updatedEnabledTypes = enabled ? [...FILTERED_ALERT_TYPES] : [];
      
      // Update state
      dispatch({ type: 'SET_ENABLED_ALERT_TYPES', payload: updatedEnabledTypes });
      
      // Save to storage
      await AsyncStorage.setItem('enabledAlertTypes', JSON.stringify(updatedEnabledTypes));
      
      return true;
    } catch (error) {
      console.error('[AlertsContext] Error toggling all alert types:', error);
      return false;
    }
  };

  // Check if an alert type should trigger an alarm
  const isAlarmEnabledForAlertType = (alertType: string): boolean => {
    return state.alarmEnabledAlertTypes.includes(alertType);
  };

  // Toggle alarm for an individual alert type
  const toggleAlarmForAlertType = async (alertType: string): Promise<boolean> => {
    try {
      const updatedAlarmEnabledTypes = [...state.alarmEnabledAlertTypes];
      
      if (updatedAlarmEnabledTypes.includes(alertType)) {
        // Remove the alert type
        const index = updatedAlarmEnabledTypes.indexOf(alertType);
        updatedAlarmEnabledTypes.splice(index, 1);
      } else {
        // Add the alert type
        updatedAlarmEnabledTypes.push(alertType);
      }
      
      // Update state
      dispatch({ type: 'SET_ALARM_ENABLED_ALERT_TYPES', payload: updatedAlarmEnabledTypes });
      
      // Save to storage
      await AsyncStorage.setItem('alarmEnabledAlertTypes', JSON.stringify(updatedAlarmEnabledTypes));
      
      return true;
    } catch (error) {
      console.error('[AlertsContext] Error toggling alarm for alert type:', error);
      return false;
    }
  };

  // Toggle alarm for all alert types at once
  const toggleAlarmForAllAlertTypes = async (enabled: boolean): Promise<boolean> => {
    try {
      const updatedAlarmEnabledTypes = enabled ? [...FILTERED_ALERT_TYPES] : [];
      
      // Update state
      dispatch({ type: 'SET_ALARM_ENABLED_ALERT_TYPES', payload: updatedAlarmEnabledTypes });
      
      // Save to storage
      await AsyncStorage.setItem('alarmEnabledAlertTypes', JSON.stringify(updatedAlarmEnabledTypes));
      
      return true;
    } catch (error) {
      console.error('[AlertsContext] Error toggling alarm for all alert types:', error);
      return false;
    }
  };

  return (
    <AlertsContext.Provider value={{ 
      state, 
      dispatch, 
      toggleSound, 
      setSoundVolume, 
      toggleNotifications,
      toggleAlertType,
      isAlertTypeEnabled,
      toggleAllAlertTypes,
      toggleAlarmForAlertType,
      isAlarmEnabledForAlertType,
      toggleAlarmForAllAlertTypes
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