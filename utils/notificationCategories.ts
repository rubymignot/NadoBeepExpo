import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Define categories for actionable notifications
export async function setNotificationCategories() {
  if (Platform.OS === 'web') return;
  
  // Tornado warning category with action buttons
  await Notifications.setNotificationCategoryAsync('tornado_warning', [
    {
      identifier: 'view_details',
      buttonTitle: 'View Details',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: true
      }
    },
    {
      identifier: 'mark_safe',
      buttonTitle: 'Mark as Safe',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: false
      }
    }
  ]);
  
  // Regular weather alert category with action buttons
  await Notifications.setNotificationCategoryAsync('weather_alert', [
    {
      identifier: 'view_details',
      buttonTitle: 'View Details',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: true
      }
    },
    {
      identifier: 'dismiss',
      buttonTitle: 'Dismiss',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: false
      }
    }
  ]);
}
