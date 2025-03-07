import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from '@/types/alerts';
import { setupBackgroundFetch, triggerBackgroundFetch } from '@/services/backgroundTask';
import { stopAlarmSound } from '@/services/soundService';

// State type
interface AlertsState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: string | null;
  isSoundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
}

// Action types
type AlertsAction =
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_UPDATE'; payload: string }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean }
  | { type: 'SET_SOUND_VOLUME'; payload: number }
  | { type: 'SET_NOTIFICATIONS_ENABLED'; payload: boolean }
  | { type: 'CLEAR_ALERTS' };

// Context type
interface AlertsContextType {
  state: AlertsState;
  dispatch: React.Dispatch<AlertsAction>;
  fetchAlerts: () => Promise<void>;
  markAlertSeen: (alertId: string) => Promise<void>;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  toggleNotifications: () => Promise<boolean>;
}

// Initial state
const initialState: AlertsState = {
  alerts: [],
  isLoading: false,
  error: null,
  lastUpdate: null,
  isSoundEnabled: true,
  soundVolume: 0.8,
  notificationsEnabled: false,
};

// Reducer function
const alertsReducer = (state: AlertsState, action: AlertsAction): AlertsState => {
  switch (action.type) {
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LAST_UPDATE':
      return { ...state, lastUpdate: action.payload };
    case 'SET_SOUND_ENABLED':
      return { ...state, isSoundEnabled: action.payload };
    case 'SET_SOUND_VOLUME':
      return { ...state, soundVolume: action.payload };
    case 'SET_NOTIFICATIONS_ENABLED':
      return { ...state, notificationsEnabled: action.payload };
    case 'CLEAR_ALERTS':
      return { ...state, alerts: [] };
    default:
      return state;
  }
};

// Create context
const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

// Provider component
export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(alertsReducer, initialState);

  // Initialize settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const soundEnabled = await AsyncStorage.getItem('soundEnabled');
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

  // Set up background fetch when component mounts or notification status changes
  useEffect(() => {
    const updateBackgroundFetch = async () => {
      try {
        await setupBackgroundFetch(state.notificationsEnabled);
        
        // If enabling notifications, immediately check for alerts
        if (state.notificationsEnabled) {
          triggerBackgroundFetch().catch(err => 
            console.warn('Failed to trigger immediate background fetch:', err)
          );
        }
      } catch (error) {
        console.error('Error setting up background fetch:', error);
      }
    };
    
    updateBackgroundFetch();
    
    // Initial fetch
    fetchAlerts();
    
    // Set up interval for fetching alerts every 30 seconds when app is in foreground
    const intervalId = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(intervalId);
  }, [state.notificationsEnabled]);

  // Fetch alerts from NWS API
  const fetchAlerts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      console.log('Fetching alerts from NWS API...');
      const response = await fetch('https://api.weather.gov/alerts/active', {
        headers: {
          'User-Agent': '(NadoBeep, contact@nadobeep.com)',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.features?.length || 0} alerts from NWS API`);
      
      // Filter alerts
      const filteredAlerts = await filterAlerts(data.features || []);
      console.log(`Filtered down to ${filteredAlerts.length} alerts`);
      
      dispatch({ type: 'SET_ALERTS', payload: filteredAlerts });
      dispatch({ type: 'SET_LAST_UPDATE', payload: new Date().toISOString() });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch alerts' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Filter alerts based on criteria
  const filterAlerts = async (alerts: Alert[]): Promise<Alert[]> => {
    try {
      console.log(`Total alerts before filtering: ${alerts.length}`);
      
      // Get seen alert IDs
      const seenAlertsString = await AsyncStorage.getItem('seenAlerts');
      const seenAlerts = seenAlertsString ? seenAlertsString.split('|') : [];
      
      console.log(`Number of seen alerts: ${seenAlerts.length}`);
      
      // First filter just by type to debug
      const requiredTypes = [
        'Severe Thunderstorm Warning',
        'Tornado Warning',
        'Flash Flood Warning',
        'Flash Flood Statement',
        'Flood Warning',
        'Flood Statement',
        'Special Marine Warning',
        'Snow Squall Warning',
        'Dust Storm Warning',
        'Dust Storm Advisory',
        'Extreme Wind Warning',
        'Severe Weather Statement',
        'Test Tornado Warning',
      ];
      
      const byTypeOnly = alerts.filter(alert => 
        requiredTypes.includes(alert.properties.event)
      );
      console.log(`Alerts matching required types: ${byTypeOnly.length}`);
      
      // Now check polygon requirement - CHANGE: Don't filter based on "seen" status
      const filteredAlerts = byTypeOnly.filter(alert => 
        alert.geometry && alert.geometry.type === 'Polygon'
      );
      console.log(`Alerts with polygon geometry: ${filteredAlerts.length}`);
      
      // Sort alerts to put unseen ones first
      filteredAlerts.sort((a, b) => {
          // If seen status is the same, sort by date (newest first)
          return new Date(b.properties.sent).getTime() - new Date(a.properties.sent).getTime();
      });
      
      // For debugging, add a test alert if no real alerts are found
      if (filteredAlerts.length === 0 && alerts.length > 0) {
        // Find at least one alert to use as a template
        if (byTypeOnly.length > 0) {
          const testAlert = JSON.parse(JSON.stringify(byTypeOnly[0]));
          testAlert.properties.id = `test-alert-${Date.now()}`;
          testAlert.properties.event = 'Test Tornado Warning';
          testAlert.properties.headline = 'This is a TEST alert created for debugging';
          testAlert.properties.seen = false;
          console.log('Adding a test alert for debugging purposes');
          filteredAlerts.push(testAlert);
        }
      }

      return filteredAlerts;
    } catch (error) {
      console.error('Error filtering alerts:', error);
      return [];
    }
  };

  // Mark an alert as seen
  const markAlertSeen = async (alertId: string) => {
    try {
      const seenAlertsString = await AsyncStorage.getItem('seenAlerts');
      const seenAlerts = seenAlertsString ? seenAlertsString.split('|') : [];
      
      if (!seenAlerts.includes(alertId)) {
        seenAlerts.push(alertId);
        await AsyncStorage.setItem('seenAlerts', seenAlerts.join('|'));
      }
    } catch (error) {
      console.error('Error marking alert as seen:', error);
    }
  };

  // Toggle sound on/off
  const toggleSound = async () => {
    const newSoundEnabled = !state.isSoundEnabled;
    dispatch({ type: 'SET_SOUND_ENABLED', payload: newSoundEnabled });
    
    try {
      await AsyncStorage.setItem('soundEnabled', JSON.stringify(newSoundEnabled));
      
      // If turning off, stop any playing sounds
      if (!newSoundEnabled) {
        stopAlarmSound();
      }
    } catch (error) {
      console.error('Error saving sound setting:', error);
    }
  };

  // Set sound volume
  const setSoundVolume = async (volume: number) => {
    dispatch({ type: 'SET_SOUND_VOLUME', payload: volume });
    
    try {
      await AsyncStorage.setItem('soundVolume', JSON.stringify(volume));
    } catch (error) {
      console.error('Error saving volume setting:', error);
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
      
      // Background fetch update is handled by the useEffect
      
      return newNotificationsEnabled;
    } catch (error) {
      console.error('Error toggling notifications:', error);
      return state.notificationsEnabled;
    }
  };

  const value = {
    state,
    dispatch,
    fetchAlerts,
    markAlertSeen,
    toggleSound,
    setSoundVolume,
    toggleNotifications,
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
};

// Hook to use the alerts context
export const useAlertsContext = () => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlertsContext must be used within an AlertsProvider');
  }
  return context;
};
