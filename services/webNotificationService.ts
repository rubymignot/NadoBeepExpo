import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FILTERED_ALERT_TYPES } from '@/constants/alerts';
import { playAlarmSound, enableAudioPlayback } from './soundService';

// Flag to track if permission has been granted
let notificationPermission: 'granted' | 'denied' | 'default' | null = null;
let webNotificationsInitialized = false;

// Check if the browser supports notifications
export const isBrowserNotificationSupported = (): boolean => {
  return Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window;
};

// Request permission to show notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isBrowserNotificationSupported()) {
    return false;
  }

  try {
    // Enable audio playback on user interaction
    enableAudioPlayback();
    
    const permission = await window.Notification.requestPermission();
    notificationPermission = permission;
    webNotificationsInitialized = true;
    
    // Store permission state
    await AsyncStorage.setItem('webNotificationPermission', permission);
    
    return permission === 'granted';
  } catch (error) {
    console.error('[WebNotification] Error requesting permission:', error);
    return false;
  }
};

// Get current notification permission status
export const getNotificationPermission = async (): Promise<string | null> => {
  if (!isBrowserNotificationSupported()) {
    return null;
  }

  // If we've already checked permission in this session, return cached value
  if (notificationPermission) {
    return notificationPermission;
  }

  // Try to get stored permission first
  const storedPermission = await AsyncStorage.getItem('webNotificationPermission');
  if (storedPermission) {
    notificationPermission = storedPermission as 'granted' | 'denied' | 'default';
    return storedPermission;
  }

  // Otherwise check current permission
  notificationPermission = window.Notification.permission as 'granted' | 'denied' | 'default';
  await AsyncStorage.setItem('webNotificationPermission', notificationPermission);
  return notificationPermission;
};

// Show a web notification
export const showWebNotification = async (
  title: string,
  body: string,
  id: string,
  isTornadoWarning: boolean = false
): Promise<boolean> => {
  if (!isBrowserNotificationSupported()) {
    return false;
  }
  
  try {
    // Check if notifications are enabled
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    if (notificationsEnabled !== 'true') {
      console.log('[WebNotification] Notifications are disabled');
      return false;
    }
    
    const permission = await getNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('[WebNotification] Permission not granted');
      return false;
    }
    
    // Create notification options with images from public folder
    const options = {
      body,
      icon: '/icon-192.png', // Update path if needed
      tag: id,
      requireInteraction: isTornadoWarning, // Keep tornado warnings until dismissed
      vibrate: isTornadoWarning ? [200, 100, 200, 100, 200, 100, 200] : [100, 50, 100],
      badge: '/icon-72.png', // Update path if needed
      renotify: true // Override notifications with the same tag
    };
    
    // Show the notification
    const notification = new window.Notification(title, options);
    
    // Add click handler
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    // Play sound if it's a tornado warning
    if (isTornadoWarning) {
      const isSoundEnabled = await AsyncStorage.getItem('isSoundEnabled') === 'true';
      if (isSoundEnabled) {
        const soundVolume = await AsyncStorage.getItem('soundVolume');
        const volume = soundVolume ? parseFloat(soundVolume) : 0.8;
        
        // Enable sound playback (needed for some browsers)
        enableAudioPlayback();
        
        // Play the alarm sound
        playAlarmSound(volume).catch(error => {
          console.error('[WebNotification] Failed to play alarm sound:', error);
        });
      }
    }
    
    // Log notification time for diagnostics
    await AsyncStorage.setItem('lastNotificationTime', new Date().toISOString());
    
    // Increment notification counter
    const notificationCount = parseInt(await AsyncStorage.getItem('notificationCount') || '0');
    await AsyncStorage.setItem('notificationCount', (notificationCount + 1).toString());
    
    console.log(`[WebNotification] Successfully showed notification: ${title}`);
    return true;
  } catch (error) {
    console.error('[WebNotification] Error showing notification:', error);
    return false;
  }
};

// Web version of checkForAlerts
export const checkForWebAlerts = async (): Promise<boolean> => {
  try {
    console.log('[WebNotification] Checking for alerts');
    
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      // Fetch alerts from NWS API
      const response = await fetch('https://api.weather.gov/alerts/active', {
        headers: {
          'User-Agent': '(NadoBeep)',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error fetching alerts: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[WebNotification] Received ${data.features?.length || 0} alerts from NWS API`);
      
      // Process alerts
      // Get previously seen alerts
      const seenAlertsString = await AsyncStorage.getItem('seenAlerts');
      const seenAlerts = seenAlertsString ? seenAlertsString.split('|') : [];
      
      // Filter for important alerts with polygons
      const importantAlerts = (data.features || []).filter((alert: any) => {
        return FILTERED_ALERT_TYPES.includes(alert.properties.event) && 
               alert.geometry && 
               alert.geometry.type === 'Polygon' &&
               !seenAlerts.includes(alert.properties.id);
      });
      
      console.log(`[WebNotification] Found ${importantAlerts.length} new important alerts`);
      
      if (importantAlerts.length > 0) {
        const updatedSeenAlerts = [...seenAlerts];
        
        for (const alert of importantAlerts) {
          const {
            id,
            event,
            headline,
            description
          } = alert.properties;
          
          if (seenAlerts.includes(id)) continue;
          
          const isTornadoWarning = event.includes('Tornado');
          
          // Show notification
          console.log(`[WebNotification] Sending notification for ${event}: ${id}`);
          await showWebNotification(
            event,
            headline || description?.substring(0, 100) || 'Weather Alert',
            id,
            isTornadoWarning
          );
          
          updatedSeenAlerts.push(id);
        }
        
        // Save updated seen alerts
        await AsyncStorage.setItem('seenAlerts', updatedSeenAlerts.join('|'));
        
        // Update active alert count
        const existingAlerts = data.features.filter((alert: any) => 
          FILTERED_ALERT_TYPES.includes(alert.properties.event) && 
          alert.geometry && 
          alert.geometry.type === 'Polygon'
        ).length;
        
        await AsyncStorage.setItem('activeAlertCount', existingAlerts.toString());
        
        return true;
      }
      
      return false;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('[WebNotification] Error checking for alerts:', error);
    return false;
  }
};

// Initialize web notifications during import
if (isBrowserNotificationSupported() && !webNotificationsInitialized) {
  getNotificationPermission()
    .then(permission => {
      if (permission === 'granted') {
        console.log('[WebNotification] Permission already granted');
        webNotificationsInitialized = true;
      }
    })
    .catch(error => {
      console.error('[WebNotification] Error checking permission:', error);
    });
}
