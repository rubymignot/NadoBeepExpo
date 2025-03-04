import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_HISTORY_KEY = '@nado-beep/notification-history';

interface NotificationRecord {
  id: string;
  expiresAt: string;
  notifiedAt: string;
}

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  }
};

export async function getNotifiedAlerts(): Promise<Map<string, NotificationRecord>> {
  try {
    const history = await storage.getItem(NOTIFICATION_HISTORY_KEY);
    return new Map(history ? JSON.parse(history) : []);
  } catch (error) {
    console.error('Error loading notification history:', error);
    return new Map();
  }
}

export async function addNotifiedAlert(alertId: string, expiresAt: string): Promise<void> {
  try {
    const history = await getNotifiedAlerts();
    const expirationDate = new Date(expiresAt).toISOString();
    
    // Only add if not already present
    if (!history.has(alertId)) {
      history.set(alertId, {
        id: alertId,
        expiresAt: expirationDate,
        notifiedAt: new Date().toISOString()
      });
      
      const historyArray = Array.from(history.entries());
      await storage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(historyArray));
    }
  } catch (error) {
    console.error('Error saving notification history:', error);
  }
}

export async function cleanExpiredAlerts(): Promise<void> {
  try {
    const history = await getNotifiedAlerts();
    const now = new Date();
    
    // Remove expired entries
    for (const [id, record] of history.entries()) {
      if (new Date(record.expiresAt) < now) {
        history.delete(id);
      }
    }
    
    const historyArray = Array.from(history.entries());
    await storage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(historyArray));
  } catch (error) {
    console.error('Error cleaning notification history:', error);
  }
}

export function isAlertStillValid(alertId: string, notifications: Map<string, NotificationRecord>): boolean {
  // If it's a test alert, always consider it valid
  if (alertId.startsWith('TEST-')) {
    return true;
  }

  const record = notifications.get(alertId);
  if (!record) {
    // If we haven't notified about this alert before, it's valid
    return true;
  }
  
  const now = new Date();
  const expiresAt = new Date(record.expiresAt);
  
  // Return false if expired, true if still valid
  return now <= expiresAt;
}
