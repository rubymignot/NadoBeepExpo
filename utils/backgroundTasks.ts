import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alert, AlertsResponse, AlertEvent } from '../types/alerts';
import { FILTERED_ALERT_TYPES } from '../constants/alerts';
import { 
  getNotifiedAlerts, 
  addNotifiedAlert, 
  cleanExpiredAlerts 
} from './notificationStorage';

// Define task names
export const BACKGROUND_FETCH_TASK = 'background-fetch-alerts';

// Initialize a set to track alerts we've already notified about during this session
const notifiedAlertsSet = new Set<string>();

// Define the background task that will fetch alerts
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log(`[Background Task] Running NWS alerts fetch: ${new Date().toISOString()}`);
  
  try {
    // Clean expired alerts from storage first
    await cleanExpiredAlerts();
    
    // Get alerts that we've already notified about
    const notifiedAlerts = await getNotifiedAlerts();
    notifiedAlerts.forEach((_, id) => {
      notifiedAlertsSet.add(id);
    });
    
    // Fetch alerts from NWS API
    const response = await fetch('https://api.weather.gov/alerts/active');
    
    if (!response.ok) {
      throw new Error(`Error fetching alerts: ${response.status}`);
    }
    
    const data: AlertsResponse = await response.json();
    
    // Filter alerts to only include the specified types
    const filteredAlerts = data.features.filter((alert) => 
      FILTERED_ALERT_TYPES.includes(alert.properties.event as AlertEvent)
    );
    
    let newAlertsFound = false;
    
    // Process each alert
    for (const alert of filteredAlerts) {
      const alertId = alert.properties.id;
      
      // Skip if we've already notified about this alert
      if (notifiedAlertsSet.has(alertId)) {
        continue;
      }
      
      // Add to notified set and storage
      notifiedAlertsSet.add(alertId);
      await addNotifiedAlert(alertId, alert.properties.expires);
      
      const isTornado = alert.properties.event === AlertEvent.TornadoWarning;
      newAlertsFound = true;
      
      // Show notification
      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: isTornado ? '🚨 TORNADO WARNING 🚨' : alert.properties.event,
            body: alert.properties.headline,
            data: { alertId, isTornado },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 250, 250, 250],
            color: '#e74c3c',
            autoDismiss: !isTornado,
            sticky: isTornado,
            categoryIdentifier: isTornado ? 'tornado_warning' : 'weather_alert'
          },
          trigger: null, // Send immediately
        });
      }
    }
    
    return newAlertsFound 
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
    
  } catch (error) {
    console.error('[Background Task] Error in background fetch task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background fetch task
export async function registerBackgroundFetchTask() {
  try {
    // Check if the task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      console.log('[Background Task] Task already registered');
      return;
    }
    
    // Register the task - note that while we want 15s intervals,
    // the system may throttle this to a minimum of several minutes
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15, // Request 15 seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    // Also set up a foreground task using setInterval when the app is open
    console.log('[Background Task] Background fetch task registered');
    
    return true;
  } catch (error) {
    console.error('[Background Task] Error registering background task:', error);
    return false;
  }
}

// Unregister the background fetch task
export async function unregisterBackgroundFetchTask() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('[Background Task] Background fetch task unregistered');
    return true;
  } catch (error) {
    console.error('[Background Task] Error unregistering background task:', error);
    return false;
  }
}

// Check the status of the background fetch task
export async function checkBackgroundFetchStatus() {
  const status = await BackgroundFetch.getStatusAsync();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  
  return {
    status: status !== null ? BackgroundFetch.BackgroundFetchStatus[status] : 'Unavailable',
    isRegistered,
  };
}
