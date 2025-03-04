import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_HISTORY_KEY = '@nado-beep/notification-history';

export async function getNotifiedAlerts(): Promise<Set<string>> {
  try {
    const history = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return new Set(history ? JSON.parse(history) : []);
  } catch (error) {
    console.error('Error loading notification history:', error);
    return new Set();
  }
}

export async function addNotifiedAlert(alertId: string): Promise<void> {
  try {
    const history = await getNotifiedAlerts();
    history.add(alertId);
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify([...history]));
  } catch (error) {
    console.error('Error saving notification history:', error);
  }
}

export async function clearNotificationHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing notification history:', error);
  }
}
