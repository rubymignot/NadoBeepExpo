import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  startForegroundService as startNotifeeService,
  updateForegroundNotification,
  stopForegroundService as stopNotifeeService,
  isNotifeeServiceRunning,
  checkForAlerts,
  createNotificationChannels
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
let serviceStarting = false; // Flag to prevent concurrent service starts
let serviceStopping = false; // Flag to prevent concurrent service stops

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
  
  // Run the first check immediately - but wrap in try/catch to prevent crashes
  try {
    if (Platform.OS === 'web') {
      checkForWebAlerts().catch(error => {
        console.error('[AlertService] Initial web check failed:', error);
      });
    } else {
      checkForAlerts().catch(error => {
        console.error('[AlertService] Initial check failed:', error);
      });
    }
  } catch (error) {
    console.error('[AlertService] Error during initial alert check:', error);
  }
  
  // Set up new interval with safe execution
  pollingInterval = setInterval(async () => {
    try {
      // Check if notifications are still enabled
      const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notificationsEnabled !== 'true') {
        stopPollingForAlerts();
        return;
      }
      
      console.log('[AlertService] Polling for alerts (foreground)');
      await AsyncStorage.setItem(LAST_SERVICE_RUN_KEY, Date.now().toString());
      
      // Use web or native check based on platform
      if (Platform.OS === 'web') {
        try {
          await checkForWebAlerts();
        } catch (error) {
          console.error('[AlertService] Web alert check failed:', error);
        }
      } else {
        try {
          await checkForAlerts();
          
          // Update notification with Notifee
          const alertCount = await getActiveAlertCount();
          await updateForegroundNotification(alertCount);
        } catch (error) {
          console.error('[AlertService] Native alert check failed:', error);
          
          // Track error 
          const errorCount = parseInt(await AsyncStorage.getItem('fetchErrorCount') || '0', 10);
          await AsyncStorage.setItem('fetchErrorCount', (errorCount + 1).toString());
        }
      }
    } catch (error) {
      console.error('[AlertService] Error in polling cycle:', error);
    }
  }, SERVICE_CHECK_INTERVAL);
  
  // Update active status in storage
  AsyncStorage.setItem('backgroundIntervalActive', 'true')
    .catch(err => console.error('[AlertService] Failed to update interval status:', err));
};

// Stop the foreground polling
const stopPollingForAlerts = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    
    // Update active status in storage
    AsyncStorage.setItem('backgroundIntervalActive', 'false')
      .catch(err => console.error('[AlertService] Failed to update interval status:', err));
  }
};

// Start the alert services (platform specific)
export const startAlertServices = async (): Promise<boolean> => {
  // Prevent concurrent starts
  if (serviceStarting) {
    console.log('[AlertService] Service start already in progress');
    return false;
  }
  
  try {
    serviceStarting = true;
    
    // First check if notifications are enabled
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    if (notificationsEnabled !== 'true') {
      console.log('[AlertService] Notifications disabled, not starting services');
      serviceStarting = false;
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
          serviceStarting = false;
          return false;
        }
      }
      
      // Start polling if app is active
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        startPollingForAlerts();
      }
      
      // Update timestamp
      await AsyncStorage.setItem(LAST_SERVICE_RUN_KEY, Date.now().toString());
      serviceStarting = false;
      return true;
    }
    
    // Native platforms (primarily Android)
    if (Platform.OS !== 'android') {
      console.log('[AlertService] Full background services only supported on Android');
      serviceStarting = false;
      return false;
    }
    
    try {
      // Create notification channels first to ensure they exist
      await createNotificationChannels();
      
      // Get existing alert count
      const alertCount = await getActiveAlertCount();
      
      console.log('[AlertService] Starting alert services with Notifee');
      
      // Store the current time as service start time
      await AsyncStorage.setItem('serviceStartTime', new Date().toISOString());
      
      // Start the Notifee foreground service
      const success = await startNotifeeService(alertCount);
      if (!success) {
        throw new Error('Failed to create service notification');
      }
      
      // Wait a moment to ensure service is started
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start foreground polling if app is active
      if (AppState.currentState === 'active') {
        startPollingForAlerts();
      }
      
      // Update timestamp
      await AsyncStorage.setItem(LAST_SERVICE_RUN_KEY, Date.now().toString());
      
      console.log('[AlertService] Services started successfully');
      serviceStarting = false;
      return true;
    } catch (error) {
      console.error('[AlertService] Failed to start services:', error);
      serviceStarting = false;
      return false;
    }
  } catch (error) {
    console.error('[AlertService] Error in startAlertServices:', error);
    serviceStarting = false;
    return false;
  }
};

// Stop alert services
export const stopAlertServices = async (): Promise<boolean> => {
  // Prevent concurrent stops
  if (serviceStopping) {
    console.log('[AlertService] Service stop already in progress');
    return false;
  }
  
  try {
    serviceStopping = true;
    console.log('[AlertService] Stopping alert services');
    
    // Stop foreground polling
    stopPollingForAlerts();
    
    if (Platform.OS === 'android') {
      // Stop Notifee foreground service
      await stopNotifeeService();
    }
    
    console.log('[AlertService] Services stopped');
    serviceStopping = false;
    return true;
  } catch (error) {
    console.error('[AlertService] Failed to stop services:', error);
    serviceStopping = false;
    return false;
  }
};

// Check if services are running
export const isAlertServiceRunning = async (): Promise<boolean> => {
  try {
    // First check Notifee service status
    if (Platform.OS === 'android') {
      try {
        const notifeeRunning = await isNotifeeServiceRunning();
        if (notifeeRunning) return true;
      } catch (error) {
        console.error('[AlertService] Error checking Notifee service:', error);
      }
    }
    
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
    // Check if notifications are enabled
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    if (notificationsEnabled !== 'true') return false;
    
    // Check if service is running
    const isRunning = await isAlertServiceRunning();
    
    if (!isRunning) {
      console.log('[AlertService] Service not running, restarting');
      
      // Stop services first to ensure clean state
      await stopAlertServices();
      
      // Wait briefly before restarting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Restart services
      await startAlertServices();
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
