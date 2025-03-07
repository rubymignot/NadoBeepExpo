import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Request permissions for notifications
export const requestNotificationPermissions = async () => {
  // Skip notification permissions on web
  if (Platform.OS === 'web') {
    return true; // Web doesn't require explicit permission for notifications
  }
  
  if (!Device.isDevice) {
    // This is an emulator/simulator
    return false;
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Only ask if permissions haven't been determined
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true,
        },
      });
      finalStatus = status;
    }
    
    // Save the permission status
    await AsyncStorage.setItem('notificationPermission', finalStatus);
    
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Configure notification behavior
export const configureNotifications = async () => {
  // Skip notification configuration on web
  if (Platform.OS === 'web') {
    return;
  }
  
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
  
  // Configure notification channels for Android
  if (Platform.OS === 'android') {
    await createNotificationChannels();
  }
};

// Create notification channels for Android
const createNotificationChannels = async () => {
  // Skip on web
  if (Platform.OS === 'web') {
    return;
  }
  
  await Notifications.setNotificationChannelAsync('tornado-warnings', {
    name: 'Tornado Warnings',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250, 250, 250],
    lightColor: '#FF0000',
    sound: 'alarm.mp3', // must match filename in app.json expo.notifications.sounds
    enableVibrate: true,
    showBadge: true,
  });
  
  await Notifications.setNotificationChannelAsync('severe-weather', {
    name: 'Severe Weather Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFA500',
    enableVibrate: true,
    showBadge: true,
  });

  // Add a low-priority channel for the background service notification
  await Notifications.setNotificationChannelAsync('background-service', {
    name: 'Background Service',
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [0],
    lightColor: '#e74c3c',
    enableVibrate: false,
    showBadge: false,
  });
};

// Show a notification
export const showNotification = async (
  title: string,
  body: string,
  id: string,
  isTornadoWarning: boolean = false
) => {
  // For web, use the Web Notifications API if available
  if (Platform.OS === 'web') {
    try {
      if ('Notification' in window) {
        // Check if browser supports notifications
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico', // Use your app's favicon
            tag: id,
          });
        } else if (Notification.permission !== 'denied') {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/favicon.ico',
              tag: id,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error showing web notification:', error);
    }
    return;
  }
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { id },
        sound: isTornadoWarning ? 'alarm.mp3' : 'default',
        priority: isTornadoWarning ? 'max' : 'high',
        vibrate: isTornadoWarning 
          ? [0, 250, 250, 250, 250, 250, 250, 250] 
          : [0, 250, 250, 250],
      },
      trigger: null, // Display immediately
      identifier: id, // Use the alert ID to prevent duplicates
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Clear a specific notification
export const dismissNotification = async (identifier: string) => {
  if (Platform.OS === 'web') {
    // Web doesn't support dismissing specific notifications
    return;
  }
  
  try {
    await Notifications.dismissNotificationAsync(identifier);
  } catch (error) {
    console.log(`Could not dismiss notification ${identifier}:`, error);
    // We don't need to rethrow - it's ok if dismissal fails
  }
};

// Clear all notifications
export const clearAllNotifications = async () => {
  if (Platform.OS === 'web') {
    // Web doesn't support clearing notifications programmatically
    return;
  }
  
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

// Set up notification listeners
export const setupNotificationListeners = () => {
  if (Platform.OS === 'web') {
    // Return a dummy subscription for web
    return {
      remove: () => {}
    };
  }
  
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const alertId = response.notification.request.content.data?.id;
    if (alertId) {
      // Handle notification tap - can be used to navigate to alert details
      console.log('Notification tapped:', alertId);
      
      // You can store this ID to navigate to it when the app opens
      AsyncStorage.setItem('lastTappedAlertId', alertId.toString());
    }
  });
  
  return subscription;
};

// Get the last notification response - with web compatibility
export const getLastNotificationResponse = async () => {
  if (Platform.OS === 'web') {
    // Web doesn't support this feature
    return null;
  }
  
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch (error) {
    console.error('Error getting last notification response:', error);
    return null;
  }
};
