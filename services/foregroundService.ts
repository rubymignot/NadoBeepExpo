import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  startForegroundService as startNotifeeService,
  updateForegroundNotification,
  stopForegroundService as stopNotifeeService,
  isNotifeeServiceRunning,
  checkForAlerts,
} from './notifeeService';
import { 
  checkForWebAlerts,
  requestNotificationPermission,
  isBrowserNotificationSupported
} from './webNotificationService';

const SERVICE_CHECK_INTERVAL = 30000; // 30 seconds between checks
const LAST_SERVICE_RUN_KEY = 'last_foreground_service_run';

// Poll for alerts in the foreground
let pollingInterval: ReturnType<typeof setInterval> | null = null;

// Helper function to get active alert count
const getActiveAlertCount = async (): Promise<number> => {
  try {
    const cachedCountStr = await AsyncStorage.getItem('activeAlertCount');
    return cachedCountStr ? parseInt(cachedCountStr, 10) : 0;
  } catch (error) {
    console.error('[AlertService] Error getting active alert count:', error);
    return 0;
  }
};

// Start polling for alerts when app is in foreground
const startPollingForAlerts = () => {
  console.log('[AlertService] Starting foreground polling');
  
  // Clear any existing interval
  stopPollingForAlerts();
  
  // Run the first check immediately
  if (Platform.OS === 'web') {
    checkForWebAlerts().catch(error => {
      console.error('[AlertService] Initial web check failed:', error);
    });
  } else {
    checkForAlerts().catch(error => {
      console.error('[AlertService] Initial check failed:', error);
    });
  }
  
  // Set up new interval
  pollingInterval = setInterval(async () => {
    try {
      const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notificationsEnabled !== 'true') {
        stopPollingForAlerts();
        return;
      }
      
      console.log('[AlertService] Polling for alerts (foreground)');
      await AsyncStorage.setItem(LAST_SERVICE_RUN_KEY, Date.now().toString());
      
      // Use web or native check based on platform
      if (Platform.OS === 'web') {
        await checkForWebAlerts();
      } else {
        await checkForAlerts();
        
        // Update notification with Notifee
        const alertCount = await getActiveAlertCount();
        await updateForegroundNotification(alertCount);
      }
    } catch (error) {
      console.error('[AlertService] Error in polling cycle:', error);
    }
  }, SERVICE_CHECK_INTERVAL);
};

// Stop the foreground polling
const stopPollingForAlerts = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

// Start the alert services (platform specific)
export const startAlertServices = async (): Promise<boolean> => {
  try {
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    if (notificationsEnabled !== 'true') {
      console.log('[AlertService] Notifications disabled, not starting services');
      return false;
    }
    
    // Handle web differently
    if (Platform.OS === 'web') {
      console.log('[AlertService] Starting web notification services');
      
      // Request permission if supported
      if (isBrowserNotificationSupported()) {
        const permissionGranted = await requestNotificationPermission();
        if (!permissionGranted) {
          console.log('[AlertService] Web notification permission not granted');
          return false;
        }
      }
      
      // Start polling if app is active
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        startPollingForAlerts();
      }
      
      // Update timestamp
      await AsyncStorage.setItem(LAST_SERVICE_RUN_KEY, Date.now().toString());
      
      return true;
    }
    
    // Native platforms (primarily Android)
    if (Platform.OS !== 'android') {
      console.log('[AlertService] Full background services only supported on Android');
      return false;
    }
    
    try {
      const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notificationsEnabled !== 'true') {
        console.log('[AlertService] Notifications disabled, not starting services');
        return false;
      }
      
      console.log('[AlertService] Starting alert services with Notifee');
      
      // Get existing alert count
      const alertCount = await getActiveAlertCount();
      
      // Start the Notifee foreground service
      const success = await startNotifeeService(alertCount);
      if (!success) {
        throw new Error('Failed to create service notification');
      }
      
      // Start foreground polling if app is active
      if (AppState.currentState === 'active') {
        startPollingForAlerts();
      }
      
      // Update timestamp
      await AsyncStorage.setItem(LAST_SERVICE_RUN_KEY, Date.now().toString());
      
      console.log('[AlertService] Services started successfully');
      return true;
    } catch (error) {
      console.error('[AlertService] Failed to start services:', error);
      return false;
    }
  } catch (error) {
    console.error('[AlertService] Failed to start services:', error);
    return false;
  }
};

// Stop alert services
export const stopAlertServices = async (): Promise<boolean> => {
  console.log('[AlertService] Stopping alert services');
  
  try {
    // Stop foreground polling
    stopPollingForAlerts();
    
    // Stop Notifee foreground service
    await stopNotifeeService();
    
    console.log('[AlertService] Services stopped');
    return true;
  } catch (error) {
    console.error('[AlertService] Failed to stop services:', error);
    return false;
  }
};

// Check if services are running
export const isAlertServiceRunning = async (): Promise<boolean> => {
  try {
    // First check Notifee service status
    const notifeeRunning = await isNotifeeServiceRunning();
    if (notifeeRunning) return true;
    
    // Fall back to checking timestamp
    const lastRunStr = await AsyncStorage.getItem(LAST_SERVICE_RUN_KEY);
    if (!lastRunStr) return false;
    
    const lastRun = parseInt(lastRunStr, 10);
    const now = Date.now();
    
    // If checked within the last 10 minutes, consider it running
    return (now - lastRun) < (10 * 60 * 1000);
  } catch (error) {
    console.error('[AlertService] Error checking service status:', error);
    return false;
  }
};

// Helper to check service health and restart if needed
export const checkAndRestartServices = async (): Promise<boolean> => {
  try {
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    if (notificationsEnabled !== 'true') return false;
    
    const isRunning = await isAlertServiceRunning();
    
    if (!isRunning) {
      console.log('[AlertService] Service not running, restarting');
      await stopAlertServices();
      setTimeout(async () => {
        await startAlertServices();
      }, 1000);
      return true;
    }
    
    // If we're in foreground but polling isn't running, restart it
    if (AppState.currentState === 'active' && !pollingInterval) {
      console.log('[AlertService] App in foreground but polling not running, restarting');
      startPollingForAlerts();
    }
    
    return true;
  } catch (error) {
    console.error('[AlertService] Error checking service health:', error);
    return false;
  }
};

// Trigger an immediate check for alerts
export const checkAlertsNow = async (): Promise<boolean> => {
  console.log('[AlertService] Manually triggering alert check');
  
  await AsyncStorage.setItem(LAST_SERVICE_RUN_KEY, Date.now().toString());
  await AsyncStorage.setItem('lastUpdateTime', new Date().toISOString());
  
  try {
    // Make sure polling is running if in foreground
    if (AppState.currentState === 'active' && !pollingInterval) {
      startPollingForAlerts();
    }
    
    // Use platform-specific check
    let result = false;
    if (Platform.OS === 'web') {
      result = await checkForWebAlerts();
    } else {
      result = await checkForAlerts();
    }
    
    // Track successful fetch
    if (result) {
      await AsyncStorage.setItem('lastSuccessfulFetch', new Date().toISOString());
      await AsyncStorage.setItem('lastFetchStatus', 'Success');
    } else {
      await AsyncStorage.setItem('lastFetchStatus', 'No new alerts');
    }
    
    return result;
  } catch (error) {
    console.error('[AlertService] Error in manual alert check:', error);
    
    // Track error
    const errorCount = parseInt(await AsyncStorage.getItem('fetchErrorCount') || '0', 10);
    await AsyncStorage.setItem('fetchErrorCount', (errorCount + 1).toString());
    await AsyncStorage.setItem('lastFetchStatus', 'Error');
    
    return false;
  }
};

// Maintain backward compatibility with old function names
export const startForegroundService = startAlertServices;
export const stopForegroundService = stopAlertServices;
export const isForegroundServiceRunning = isAlertServiceRunning;
export const isServiceHealthy = checkAndRestartServices;
