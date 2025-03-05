import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';

import { Alert, AlertEvent } from '../types/alerts';
import { 
  getNotifiedAlerts, 
  addNotifiedAlert, 
  cleanExpiredAlerts
} from '../utils/notificationStorage';

// Configure notification handler - ensure important notifications break through in all states
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX
  }),
});

// Request permissions with elevated priority
async function requestNotificationPermissions() {
  if (Platform.OS === 'web' && 'Notification' in window) {
    try {
      if (Notification.permission === 'denied') {
        return false;
      }
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  } else if (Platform.OS !== 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
          importance: Notifications.AndroidImportance.MAX,
          priority: 'max',
          allowInForeground: true,
        },
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: true,
          provideAppNotificationSettings: true,
          allowProvisional: true,
        }
      });
      return status === 'granted';
    }
    return true;
  }
  return false;
}

// Props for the hook
interface UseNotificationsProps {
  soundEnabled: boolean;
  playAlarmSound: (event: AlertEvent) => Promise<void>;
  stopAlarmSound: () => void;
}

export function useNotifications({
  soundEnabled,
  playAlarmSound,
  stopAlarmSound,
}: UseNotificationsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifiedAlerts, setNotifiedAlerts] = useState<Map<string, any>>(new Map());
  const [backgroundTaskRegistered, setBackgroundTaskRegistered] = useState(false);
  const router = useRouter();
  
  // Keep track of alert IDs we've already shown notifications for
  const notifiedAlertsRef = useRef<Set<string>>(new Set());
  const lastManualRefreshTime = useRef<Date>(new Date());
  const appState = useRef(AppState.currentState);
  const serviceInitialized = useRef(false);

  // Initialize notifications and check background task status
  useEffect(() => {
    let isMounted = true;
    
    const setup = async () => {
      // Request permissions
      await requestNotificationPermissions();
      
      // Clean expired alerts
      await cleanExpiredAlerts();
      
      // Load notification history
      const history = await getNotifiedAlerts();
      if (isMounted) setNotifiedAlerts(history);
      
      // Initialize notified alerts from history
      history.forEach((_, id) => {
        notifiedAlertsRef.current.add(id);
      });
      
      // Update background task registration status if on a device
      if (Platform.OS !== 'web' && Device.isDevice) {
        // We'll get this information from BackgroundTaskContext now
        setBackgroundTaskRegistered(true);
      }
    };

    setup();
    
    // App state change listener
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // App has become active again, refresh our status
        setup();
      }
      
      appState.current = nextAppState;
    });
    
    // Configure background notification handler
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const alertId = response.notification.request.content.data?.alertId;
      // Handle response based on the action identifier
      const actionId = response.actionIdentifier;
      
      if (alertId) {
        // If it's a view details action or a tap on the notification, navigate to alert details
        if (
          actionId === Notifications.DEFAULT_ACTION_IDENTIFIER || 
          actionId === 'view_details'
        ) {
          router.push({
            pathname: '/(tabs)/alert-details',
            params: { alertId },
          });
        }
      }
    });

    // Configure foreground notification handler
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      if (soundEnabled && notification.request.content.data?.isTornado) {
        playAlarmSound(AlertEvent.TornadoWarning);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
      backgroundSubscription.remove();
      foregroundSubscription.remove();
      notifiedAlertsRef.current.clear();
    };
  }, [soundEnabled, playAlarmSound, router]);

  const toggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      // Request full permissions when enabling
      await requestNotificationPermissions();
    }
    
    setNotificationsEnabled(prev => !prev);
  }, [notificationsEnabled]);

  // Process alerts and show notifications for any that are new
  const handleAlertNotifications = useCallback(async (alerts: Alert[]) => {
    if (!notificationsEnabled) return false;

    // Get current notification history to ensure we have the latest data
    const currentNotifications = await getNotifiedAlerts();
    setNotifiedAlerts(currentNotifications);
    
    let newAlertsFound = false;

    // Process each alert
    for (const alert of alerts) {
      const alertId = alert.properties.id;
      
      // Skip if we've already notified about this alert
      if (notifiedAlertsRef.current.has(alertId)) {
        continue;
      }
      
      // Add to notified set and storage
      notifiedAlertsRef.current.add(alertId);
      await addNotifiedAlert(alertId, alert.properties.expires);
      
      const isTornado = alert.properties.event === AlertEvent.TornadoWarning;
      newAlertsFound = true;
      
      // Show notification
      if (Platform.OS === 'web') {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          new window.Notification(
            isTornado ? '🚨 TORNADO WARNING 🚨' : alert.properties.event,
            {
              body: alert.properties.headline,
              icon: '/notification-icon.png', 
              tag: alertId,
              requireInteraction: isTornado, // Keep tornado warnings visible until dismissed
            }
          );
        }
      } else {
        // Use proper notification categories for actionable notifications
        await Notifications.scheduleNotificationAsync({
          content: {
            title: isTornado ? '🚨 TORNADO WARNING 🚨' : alert.properties.event,
            body: alert.properties.headline,
            data: { alertId, isTornado },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 250, 250, 250],
            color: '#e74c3c',
            autoDismiss: !isTornado, // Keep tornado warnings until user dismisses
            sticky: isTornado,       // Only for Android
            categoryIdentifier: isTornado ? 'tornado_warning' : 'weather_alert'
          },
          trigger: null, // Send immediately
        });
      }

      // Play sound for tornado warnings
      if (isTornado && soundEnabled) {
        await playAlarmSound(AlertEvent.TornadoWarning);
        setTimeout(() => {
          stopAlarmSound();
        }, 10000);
      }
    }
    
    return newAlertsFound;
  }, [notificationsEnabled, soundEnabled, playAlarmSound, stopAlarmSound]);

  // Method to mark alerts as processed without showing notifications
  const registerAlertsWithoutNotification = useCallback(async (alerts: Alert[]) => {
    // Get current notification history
    const currentNotifications = await getNotifiedAlerts();
    
    for (const alert of alerts) {
      const alertId = alert.properties.id;
      
      // Skip if already registered
      if (notifiedAlertsRef.current.has(alertId)) {
        continue;
      }
      
      // Mark as notified and add to storage
      notifiedAlertsRef.current.add(alertId);
      await addNotifiedAlert(alertId, alert.properties.expires);
    }
    
    // Update our state with fresh data
    const updatedNotifications = await getNotifiedAlerts();
    setNotifiedAlerts(updatedNotifications);
  }, []);

  // Handle a manual refresh by finding only alerts that are newer than the last refresh
  const handleManualRefresh = useCallback(async (alerts: Alert[]) => {
    if (!notificationsEnabled) return false;
    
    // Update the manual refresh timestamp
    const currentRefreshTime = new Date();
    
    // Get current notification history
    const currentNotifications = await getNotifiedAlerts();
    setNotifiedAlerts(currentNotifications);
    
    // Find only alerts that have a newer sent time than our last refresh
    const newAlerts = alerts.filter(alert => {
      try {
        const sentTime = new Date(alert.properties.sent);
        return sentTime > lastManualRefreshTime.current;
      } catch (e) {
        return false;
      }
    });
    
    // Process notifications only for truly new alerts
    let newAlertsFound = false;
    
    for (const alert of newAlerts) {
      const alertId = alert.properties.id;
      
      // We still need to track this alert as notified even if it's not new
      if (!notifiedAlertsRef.current.has(alertId)) {
        notifiedAlertsRef.current.add(alertId);
        await addNotifiedAlert(alertId, alert.properties.expires);
        
        const isTornado = alert.properties.event === AlertEvent.TornadoWarning;
        newAlertsFound = true;
        
        // Show notification
        if (Platform.OS === 'web') {
          const hasPermission = await requestNotificationPermissions();
          if (hasPermission) {
            new window.Notification(
              isTornado ? '🚨 TORNADO WARNING 🚨' : alert.properties.event,
              {
                body: alert.properties.headline,
                icon: '/notification-icon.png',
                tag: alertId,
              }
            );
          }
        } else {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: isTornado ? '🚨 TORNADO WARNING 🚨' : alert.properties.event,
              body: alert.properties.headline,
              data: { alertId, isTornado },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
              vibrate: [0, 250, 250, 250],
              color: '#e74c3c',
            },
            trigger: null,
          });
        }
        
        // Play sound for tornado warnings
        if (isTornado && soundEnabled) {
          await playAlarmSound(AlertEvent.TornadoWarning);
          setTimeout(() => {
            stopAlarmSound();
          }, 10000);
        }
      }
    }
    
    // Update the manual refresh timestamp after processing all alerts
    lastManualRefreshTime.current = currentRefreshTime;
    
    return newAlertsFound;
  }, [notificationsEnabled, soundEnabled, playAlarmSound, stopAlarmSound]);

  // Method to reset our session tracking (useful when manually refreshing)
  const resetProcessedAlerts = useCallback(() => {
    notifiedAlertsRef.current.clear();
  }, []);

  return {
    notificationsEnabled,
    backgroundTaskRegistered,
    toggleNotifications,
    handleAlertNotifications,
    handleManualRefresh,
    registerAlertsWithoutNotification,
    notifiedAlerts,
    resetProcessedAlerts
  };
}
