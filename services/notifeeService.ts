import notifee, { AndroidColor, AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { playAlarmSound } from './soundService';
import { FILTERED_ALERT_TYPES } from '@/constants/alerts';

// The foreground service notification channel ID
export const FOREGROUND_CHANNEL_ID = 'nado-beep-foreground';

// Create notification channels for Notifee
export async function createNotificationChannels() {
  // Create the foreground service channel
  await notifee.createChannel({
    id: FOREGROUND_CHANNEL_ID,
    name: 'Alert Monitoring Service',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
  });
  
  // Create channel for tornado warnings
  await notifee.createChannel({
    id: 'tornado-warnings',
    name: 'Tornado Warnings',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    bypassDnd: true,
  });
  
  // Create channel for severe weather alerts
  await notifee.createChannel({
    id: 'severe-weather',
    name: 'Severe Weather Alerts',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
  });
}

// Start the foreground service with notification
export async function startForegroundService(alertCount = 0) {
  try {
    // Create the notification
    await notifee.displayNotification({
      title: 'NadoBeep Alert Monitor',
      body: alertCount > 0 
        ? `Monitoring for alerts - ${alertCount} active alert${alertCount === 1 ? '' : 's'}` 
        : 'Actively monitoring for weather alerts',
      android: {
        channelId: FOREGROUND_CHANNEL_ID,
        asForegroundService: true,
        ongoing: true,
        color: AndroidColor.MAROON,
        colorized: true,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Check Now',
            pressAction: {
              id: 'check',
            },
          },
          {
            title: 'Stop',
            pressAction: {
              id: 'stop',
            },
          },
        ],
      },
    });
    
    return true;
  } catch (error) {
    console.error('[NotifeeService] Failed to start foreground service:', error);
    return false;
  }
}

// Update the foreground service notification
export async function updateForegroundNotification(alertCount = 0) {
  try {
    // Get the current displayed notification
    const displayedNotifications = await notifee.getDisplayedNotifications();
    const foregroundNotification = displayedNotifications.find(
      notification => notification.notification.android?.asForegroundService
    );
    
    if (!foregroundNotification) {
      // If no foreground notification exists, create one
      await startForegroundService(alertCount);
      return true;
    }
    
    // Update the existing notification
    await notifee.displayNotification({
      id: foregroundNotification.id,
      title: 'NadoBeep Alert Monitor',
      body: alertCount > 0 
        ? `Monitoring for alerts - ${alertCount} active alert${alertCount === 1 ? '' : 's'}` 
        : 'Actively monitoring for weather alerts',
      android: {
        channelId: FOREGROUND_CHANNEL_ID,
        asForegroundService: true,
        ongoing: true,
        color: AndroidColor.MAROON,
        visibility: AndroidVisibility.PUBLIC,
        colorized: true,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Check Now',
            pressAction: {
              id: 'check',
            },
          },
          {
            title: 'Stop',
            pressAction: {
              id: 'stop',
            },
          },
        ],
      },
    });
    
    return true;
  } catch (error) {
    console.error('[NotifeeService] Failed to update foreground notification:', error);
    return false;
  }
}

// Check if Notifee foreground service is running
export async function isNotifeeServiceRunning(): Promise<boolean> {
  try {
    const displayedNotifications = await notifee.getDisplayedNotifications();
    return displayedNotifications.some(
      notification => notification.notification.android?.asForegroundService
    );
  } catch (error) {
    console.error('[NotifeeService] Error checking if service is running:', error);
    return false;
  }
}

// Stop the foreground service
export async function stopForegroundService() {
  try {
    await notifee.stopForegroundService();
    return true;
  } catch (error) {
    console.error('[NotifeeService] Failed to stop foreground service:', error);
    return false;
  }
}

// Core function to check for alerts - moved from foregroundService to fix require cycle
export const checkForAlerts = async (): Promise<boolean> => {
  try {
    console.log('[NotifeeService] Fetching alerts from NWS API');
    
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
      console.log(`[NotifeeService] Received ${data.features?.length || 0} alerts from NWS API`);
      
      // Get user's enabled alert types
      const enabledAlertTypesStr = await AsyncStorage.getItem('enabledAlertTypes');
      const enabledAlertTypes = enabledAlertTypesStr 
        ? JSON.parse(enabledAlertTypesStr) 
        : FILTERED_ALERT_TYPES; // Default to all if not set
      
      // Get user's alarm-enabled alert types
      const alarmEnabledTypesStr = await AsyncStorage.getItem('alarmEnabledAlertTypes');
      const alarmEnabledTypes = alarmEnabledTypesStr 
        ? JSON.parse(alarmEnabledTypesStr) 
        : ['Tornado Warning']; // Default to only tornado warnings for alarm
      
      // Process alerts
      // Get previously seen alerts
      const seenAlertsString = await AsyncStorage.getItem('seenAlerts');
      const seenAlerts = seenAlertsString ? seenAlertsString.split('|') : [];
      
      // Filter for important alerts with polygons that are enabled by the user
      const importantAlerts = (data.features || []).filter((alert: any) => {
        return enabledAlertTypes.includes(alert.properties.event) && 
               FILTERED_ALERT_TYPES.includes(alert.properties.event) && 
               alert.geometry && 
               alert.geometry.type === 'Polygon' &&
               !seenAlerts.includes(alert.properties.id);
      });
      
      console.log(`[NotifeeService] Found ${importantAlerts.length} new important alerts`);
      
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
          
          const shouldPlayAlarm = alarmEnabledTypes.includes(event);
          
          // Show notification
          console.log(`[NotifeeService] Sending notification for ${event}: ${id}`);
          await showAlertNotification(
            event,
            headline || description?.substring(0, 100) || 'Weather Alert',
            id,
            shouldPlayAlarm
          );
          
          // Play sound if this alert type has sound enabled (removed global sound check)
          if (shouldPlayAlarm) {
            const soundVolume = await AsyncStorage.getItem('soundVolume');
            const volume = soundVolume ? parseFloat(soundVolume) : 0.8;
            playAlarmSound(volume).catch(error => {
              console.error('[NotifeeService] Failed to play alarm sound:', error);
            });
          }
          
          updatedSeenAlerts.push(id);
        }
        
        // Save updated seen alerts
        await AsyncStorage.setItem('seenAlerts', updatedSeenAlerts.join('|'));
        
        // Update service notification with alert count
        const existingAlerts = data.features.filter((alert: any) => 
          FILTERED_ALERT_TYPES.includes(alert.properties.event) && 
          alert.geometry && 
          alert.geometry.type === 'Polygon'
        ).length;
        
        await updateServiceNotification(existingAlerts);
        
        return true;
      }
      
      return false;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('[NotifeeService] Error checking for alerts:', error);
    return false;
  }
};

// Update the service notification
const updateServiceNotification = async (alertCount: number) => {
  if (Platform.OS !== 'android') return;
  
  try {
    await AsyncStorage.setItem('activeAlertCount', alertCount.toString());
    // Update the foreground notification
    await updateForegroundNotification(alertCount);
  } catch (error) {
    console.error('[NotifeeService] Error updating service notification:', error);
  }
};

// Show a regular alert notification (not foreground service)
export async function showAlertNotification(
  title: string,
  body: string,
  id: string,
  isTornadoWarning: boolean = false
) {
  try {
    await notifee.displayNotification({
      id,
      title,
      body,
      android: {
        channelId: isTornadoWarning ? 'tornado-warnings' : 'severe-weather',
        importance: isTornadoWarning 
          ? AndroidImportance.HIGH 
          : AndroidImportance.DEFAULT,
        sound: isTornadoWarning ? 'alarm' : undefined,
        pressAction: {
          id: 'default',
        },
        timestamp: Date.now(),
        visibility: isTornadoWarning ? AndroidVisibility.PUBLIC : AndroidVisibility.PRIVATE,
      },
    });
    
    // Log notification time for diagnostics
    await AsyncStorage.setItem('lastNotificationTime', new Date().toISOString());
    
    // Increment notification counter
    const notificationCount = parseInt(await AsyncStorage.getItem('notificationCount') || '0');
    await AsyncStorage.setItem('notificationCount', (notificationCount + 1).toString());
    return true;
  } catch (error) {
    console.error('[NotifeeService] Error showing notification:', error);
    return false;
  }
}

// Register the foreground service task
export function registerForegroundService() {
  try {
    notifee.registerForegroundService(notification => {
      return new Promise(() => {
        console.log('[NotifeeService] Foreground service started');
        
        // Setup polling interval
        let pollingInterval: NodeJS.Timeout | null = null;
        let isServiceRunning = true;
        
        // Run our first check with proper error handling
        checkForAlerts()
          .then(() => {
            console.log('[NotifeeService] Initial alert check complete');
          })
          .catch(error => {
            console.error('[NotifeeService] Initial alert check failed:', error);
          });
        
        // Setup regular polling with solid error handling
        pollingInterval = setInterval(async () => {
          if (!isServiceRunning) {
            if (pollingInterval) clearInterval(pollingInterval);
            return;
          }
          
          try {
            const enabled = await AsyncStorage.getItem('notificationsEnabled');
            if (enabled !== 'true') {
              if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
              }
              isServiceRunning = false;
              await notifee.stopForegroundService();
              return;
            }
            
            // Update service timestamp
            await AsyncStorage.setItem('last_foreground_service_run', Date.now().toString());
            
            await checkForAlerts();
          } catch (error) {
            console.error('[NotifeeService] Error in polling interval:', error);
            // Don't exit polling on error - just continue to next interval
          }
        }, 30000); // Poll every 30 seconds
        
        // Listen for events
        const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
          try {
            console.log('[NotifeeService] Foreground event received:', type, detail.pressAction?.id);
            
            if (type === EventType.ACTION_PRESS) {
              // Check which action was pressed
              if (detail.pressAction?.id === 'check') {
                // Manual check button pressed
                console.log('[NotifeeService] Manual check requested from foreground');
                checkForAlerts()
                  .then(() => console.log('[NotifeeService] Manual check completed'))
                  .catch(err => console.error('[NotifeeService] Manual check failed:', err));
              } 
              else if (detail.pressAction?.id === 'stop') {
                // Stop button pressed
                console.log('[NotifeeService] Stop requested from foreground');
                if (pollingInterval) {
                  clearInterval(pollingInterval);
                  pollingInterval = null;
                }
                
                isServiceRunning = false;
                
                // Update notification setting
                AsyncStorage.setItem('notificationsEnabled', 'false')
                  .catch(err => console.error('[NotifeeService] Failed to update settings:', err));
                  
                // Stop the foreground service
                notifee.stopForegroundService();
              }
            }
          } catch (error) {
            console.error('[NotifeeService] Error handling foreground event:', error);
          }
        });
      });
    });
    
    console.log('[NotifeeService] Foreground service registered successfully');
  } catch (error) {
    console.error('[NotifeeService] Failed to register foreground service:', error);
  }
}

// Register background event handler
export function registerBackgroundHandler() {
  return notifee.onBackgroundEvent(async ({ type, detail }) => {
    try {
      console.log('[NotifeeService] Background event received:', type, detail.pressAction?.id);

      if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction?.id === 'check') {
          // Manual check requested
          console.log('[NotifeeService] Background check requested');
          await checkForAlerts();
        } else if (detail.pressAction?.id === 'stop') {
          // Stop service requested
          console.log('[NotifeeService] Background stop requested');
          await AsyncStorage.setItem('notificationsEnabled', 'false');
          await stopForegroundService();
        }
      } else if (type === EventType.PRESS) {
        // The user pressed the notification
        console.log('[NotifeeService] Notification pressed in background');
      }
    } catch (error) {
      console.error('[NotifeeService] Error handling background event:', error);
    }
  });
}