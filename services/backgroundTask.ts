import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showNotification } from '@/services/notificationService';
import { playAlarmSound } from '@/services/soundService';
import { Alert } from '@/types/alerts';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Define the background task name
const BACKGROUND_FETCH_TASK = 'background-fetch-alerts';
const FOREGROUND_SERVICE_NOTIFICATION_ID = 'nadobeep-background-service';

// Define the core logic of the task in a separate function so it can be called manually
export async function fetchAlertsLogic() {
  try {
    // Check if notifications are enabled
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    if (notificationsEnabled !== 'true') {
      console.log('[Background] Notifications disabled, skipping fetch');
      return Platform.OS === 'web' ? null : BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log('[Background] Checking for new alerts...');
    
    // Fetch alerts
    const response = await fetch('https://api.weather.gov/alerts/active', {
      headers: {
        'User-Agent': '(NadoBeep App)',
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const alerts = data.features || [];
    console.log(`[Background] Received ${alerts.length} alerts from NWS API`);
    
    // Get previously seen alerts
    const seenAlertsString = await AsyncStorage.getItem('seenAlerts');
    const seenAlerts = seenAlertsString ? seenAlertsString.split('|') : [];
    console.log(`[Background] Have ${seenAlerts.length} seen alerts in storage`);
    
    // Required alert types
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
    
    // Filter for new alerts matching our criteria
    const alertsByType = alerts.filter((alert: Alert) =>
      requiredTypes.includes(alert.properties.event)
    );
    console.log(`[Background] Alerts matching required types: ${alertsByType.length}`);
    
    // Then check for polygon geometry
    const alertsByTypeAndPolygon = alertsByType.filter((alert: Alert) =>
      alert.geometry && alert.geometry.type === 'Polygon'
    );
    console.log(`[Background] Alerts with polygon geometry: ${alertsByTypeAndPolygon.length}`);
    
    // For notifications, only use alerts that haven't been seen yet
    const newAlerts = alertsByTypeAndPolygon.filter((alert: Alert) =>
      !seenAlerts.includes(alert.properties.id)
    );
    console.log(`[Background] New unseen alerts: ${newAlerts.length}`);
    
    // Store all filtered alerts for the UI to see (including previously seen ones)
    await AsyncStorage.setItem('latestAlerts', JSON.stringify(alertsByTypeAndPolygon));
    await AsyncStorage.setItem('lastUpdateTime', new Date().toISOString());
    
    if (newAlerts.length === 0) {
      console.log('[Background] No new unseen alerts found');
      return Platform.OS === 'web' ? null : BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Process new alerts (for notifications only)
    console.log(`[Background] Processing ${newAlerts.length} new unseen alerts for notifications`);
    
    // Show notifications for new alerts
    const updatedSeenAlerts = [...seenAlerts];
    
    for (const alert of newAlerts) {
      const isTornadoWarning = alert.properties.event === 'Tornado Warning' || 
                               alert.properties.event === 'Test Tornado Warning';
      
      // Show notification
      await showNotification(
        alert.properties.event,
        alert.properties.headline || `${alert.properties.event} for ${alert.properties.areaDesc}`,
        alert.properties.id,
        isTornadoWarning
      );
      
      // Play sound for tornado warnings
      if (isTornadoWarning) {
        const soundEnabled = await AsyncStorage.getItem('soundEnabled');
        if (soundEnabled !== 'false') {
          const volumeStr = await AsyncStorage.getItem('soundVolume');
          const volume = volumeStr ? parseFloat(volumeStr) : 0.8;
          await playAlarmSound(volume);
        }
      }
      
      // Mark this alert as seen
      updatedSeenAlerts.push(alert.properties.id);
    }
    
    // Save updated seen alerts list
    await AsyncStorage.setItem('seenAlerts', updatedSeenAlerts.join('|'));
    
    return Platform.OS === 'web' ? null : BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background] Error in background fetch:', error);
    return Platform.OS === 'web' ? null : BackgroundFetch.BackgroundFetchResult.Failed;
  }
}

// Register the task handler using the core logic function - skip on web
if (Platform.OS !== 'web') {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    return await fetchAlertsLogic();
  });
}

// Configure and register the background fetch task
export const setupBackgroundFetch = async (enabled: boolean) => {
  // Skip background task registration on web
  if (Platform.OS === 'web') {
    // For web, we'll just use regular polling when the tab is open
    return;
  }

  try {
    // Check if the task is registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)
      .catch(() => false); // Handle potential errors when checking registration status
    
    if (enabled) {
      // Only register the task if it's not already registered
      if (!isRegistered) {
        console.log('Registering background fetch task...');
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 900, // 15 minutes (in seconds) - this is the minimum iOS allows
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('Background fetch registered!');
      } else {
        console.log('Background fetch task already registered');
      }
      
      // Show persistent notification on Android
      if (Platform.OS === 'android') {
        await showPersistentNotification(true);
      }
      
      // Check status
      const status = await BackgroundFetch.getStatusAsync().catch(err => {
        console.warn('Failed to get background fetch status:', err);
        return null;
      });
      
      console.log(`Background fetch status: ${status ? getStatusString(status) : 'Unknown'}, registered: ${isRegistered}`);
    } else {
      // Only try to unregister if the task is actually registered
      if (isRegistered) {
        console.log('Unregistering background fetch task...');
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK)
          .then(() => console.log('Background fetch unregistered!'))
          .catch(err => {
            // Handle specific error types
            if (err.message && err.message.includes('not found')) {
              console.log('Task was not found, considering it already unregistered');
            } else {
              throw err;
            }
          });
      } else {
        console.log('Background fetch task is not registered, nothing to unregister');
      }
      
      // Remove persistent notification on Android
      if (Platform.OS === 'android') {
        await showPersistentNotification(false);
      }
    }
  } catch (error) {
    console.error('Error setting up background fetch:', error);
  }
};

// Show or hide the persistent notification for Android
const showPersistentNotification = async (show: boolean) => {
  if (Platform.OS !== 'android') return;
  
  try {
    if (show) {
      // Create a persistent notification
      await Notifications.setNotificationChannelAsync('background-service', {
        name: 'Background Service',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        lightColor: '#e74c3c',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        enableLights: false,
        enableVibrate: false,
        showBadge: false,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'NadoBeep is active',
          body: 'Monitoring for severe weather alerts',
          data: { persistent: true },
          sticky: true, // Makes the notification persistent
          priority: 'low',
          vibrate: [0],
          color: '#e74c3c',
          autoDismiss: false,
        },
        trigger: null, // Post immediately
        identifier: FOREGROUND_SERVICE_NOTIFICATION_ID,
      });
    } else {
      // Remove the persistent notification
      await Notifications.dismissNotificationAsync(FOREGROUND_SERVICE_NOTIFICATION_ID);
    }
  } catch (error) {
    console.error('Error managing persistent notification:', error);
  }
};

// Helper function to convert BackgroundFetch status to string
function getStatusString(status: BackgroundFetch.BackgroundFetchStatus): string {
  switch (status) {
    case BackgroundFetch.BackgroundFetchStatus.Available:
      return 'Available';
    case BackgroundFetch.BackgroundFetchStatus.Denied:
      return 'Denied';
    case BackgroundFetch.BackgroundFetchStatus.Restricted:
      return 'Restricted';
    default:
      return `Unknown (${status})`;
  }
}

// Function to manually trigger a background fetch (for testing or immediate updates)
export const triggerBackgroundFetch = async () => {
  try {
    console.log('Manually triggering background fetch...');
    // Call the same logic function directly
    const result = await fetchAlertsLogic();
    console.log(`Manual background fetch complete with result: ${result}`);
    return result;
  } catch (error) {
    console.error('Error triggering manual background fetch:', error);
    return Platform.OS === 'web' ? null : BackgroundFetch.BackgroundFetchResult.Failed;
  }
};

// For web, set up a regular polling interval when the page is visible
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  let webPollingInterval: number | null = null;
  
  // Use the Page Visibility API to manage polling
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Page is visible, start polling
      if (!webPollingInterval) {
        webPollingInterval = window.setInterval(() => {
          AsyncStorage.getItem('notificationsEnabled').then(enabled => {
            if (enabled === 'true') {
              fetchAlertsLogic();
            }
          });
        }, 30000) as any; // Poll every 30 seconds
      }
    } else {
      // Page is hidden, stop polling to save resources
      if (webPollingInterval) {
        window.clearInterval(webPollingInterval);
        webPollingInterval = null;
      }
    }
  });
  
  // Initial check
  if (document.visibilityState === 'visible') {
    webPollingInterval = window.setInterval(() => {
      AsyncStorage.getItem('notificationsEnabled').then(enabled => {
        if (enabled === 'true') {
          fetchAlertsLogic();
        }
      });
    }, 30000) as any;
  }
}
