import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Volume2, VolumeX, Bell, BellOff } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { AlertItem } from '../../components/AlertList/AlertItem';
import { LoadingState } from '../../components/AlertList/LoadingState';
import { useAlertSound } from '../../hooks/useAlertSound';
import { Alert, AlertsResponse, AlertEvent } from '../../types/alerts';
import { FILTERED_ALERT_TYPES } from '../../constants/alerts';
import { styles } from '../../styles/alerts-screen.styles';
import { WebAlertGrid } from '../../components/AlertList/WebAlertGrid';
import { getNotifiedAlerts, addNotifiedAlert, cleanExpiredAlerts, isAlertStillValid } from '../../utils/notificationStorage';
import { useAlerts } from '../../context/AlertsContext';

const APP_ICON = require('../../assets/images/icon.png');

// Add notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Web notification permission request
async function requestNotificationPermission() {
  if (Platform.OS === 'web' && 'Notification' in window) {
    try {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }
  return false;
}

export default function AlertsScreen() {
  const { alerts, setAlerts } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const notifiedAlertsRef = React.useRef<Set<string>>(new Set());
  const lastRefreshTime = React.useRef<number>(Date.now());
  const router = useRouter();
  const [notifiedAlerts, setNotifiedAlerts] = useState<Map<string, any>>(new Map());
  const handledAlertsRef = useRef<Set<string>>(new Set());
  
  const { playAlarmSound, stopAlarmSound, isPlaying, isLoaded } = useAlertSound();

  useEffect(() => {
    // Load notification history and clean expired alerts on mount
    const initializeNotifications = async () => {
      await cleanExpiredAlerts();
      const history = await getNotifiedAlerts();
      setNotifiedAlerts(history);
      
      // Initialize handledAlerts from notification history
      history.forEach((record, id) => {
        if (isAlertStillValid(id, history)) {
          handledAlertsRef.current.add(id);
        }
      });
    };

    initializeNotifications();
    
    // Configure background notification handler
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const alertId = response.notification.request.content.data?.alertId;
      if (alertId) {
        router.push({
          pathname: '/(tabs)/alert-details',
          params: { alertId },
        });
      }
    });

    // Configure foreground notification handler
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      if (soundEnabled && notification.request.content.data?.isTornado) {
        playAlarmSound(AlertEvent.TornadoWarning);
      }
    });

    return () => {
      backgroundSubscription.remove();
      foregroundSubscription.remove();
      stopAlarmSound();
    };
  }, []);

  // Fetch alerts function
  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('https://api.weather.gov/alerts/active');

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data: AlertsResponse = await response.json();
      const filteredAlerts = data.features.filter((alert) =>
        FILTERED_ALERT_TYPES.includes(alert.properties.event as AlertEvent)
      );

      setAlerts(filteredAlerts);
      handleTornadoWarnings(filteredAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      console.error('Failed to fetch NWS alerts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setAlerts]);

  // Add new function to handle tornado warnings
  const handleTornadoWarnings = useCallback(async (currentAlerts: Alert[]) => {
    if (!soundEnabled) return;

    // Get current notification history
    const currentNotifications = await getNotifiedAlerts();

    // Handle notifications for all valid alerts first
    if (notificationsEnabled) {
      for (const alert of currentAlerts) {
        if (!isAlertStillValid(alert.properties.id, currentNotifications)) {
          continue;
        }

        if (!handledAlertsRef.current.has(alert.properties.id)) {
          // Add to handled set and notification history
          handledAlertsRef.current.add(alert.properties.id);
          await addNotifiedAlert(alert.properties.id, alert.properties.expires);
          
          const isTornado = alert.properties.event === AlertEvent.TornadoWarning;
          
          // Show notification
          if (Platform.OS === 'web') {
            const hasPermission = await requestNotificationPermission();
            if (hasPermission) {
              new window.Notification(
                isTornado ? '🚨 TORNADO WARNING 🚨' : alert.properties.event,
                {
                  body: alert.properties.headline,
                  icon: '/notification-icon.png',
                  tag: alert.properties.id,
                }
              );
            }
          } else {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: isTornado ? '🚨 TORNADO WARNING 🚨' : alert.properties.event,
                body: alert.properties.headline,
                data: { alertId: alert.properties.id, isTornado },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.MAX,
                vibrate: [0, 250, 250, 250],
                color: '#e74c3c',
              },
              trigger: null,
            });
          }

          // Play sound for tornado warnings
          if (isTornado && soundEnabled) {
            await playAlarmSound(AlertEvent.TornadoWarning);
            setTimeout(() => {
              stopAlarmSound();
            }, 10000);
          }
        }
      }
    }
  }, [soundEnabled, notificationsEnabled, playAlarmSound, stopAlarmSound]);

  // Add effect to handle alerts changes
  useEffect(() => {
    if (alerts.length > 0) {
      handleTornadoWarnings(alerts);
    }
  }, [alerts, handleTornadoWarnings]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    }

    fetchAlerts();
    const intervalId = setInterval(fetchAlerts, 15000);

    return () => {
      clearInterval(intervalId);
      stopAlarmSound();
    };
  }, [fetchAlerts, stopAlarmSound]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const handleAlertPress = (alert: Alert) => {
    router.push({
      pathname: '/(tabs)/alert-details',
      params: { alertId: alert.properties.id },
    });
  };

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled && isPlaying) {
      stopAlarmSound();
    }
  };

  useEffect(() => {
    return () => {
      handledAlertsRef.current.clear();
    };
  }, []);

  if (loading && !refreshing) {
    return <LoadingState />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#e74c3c', '#c0392b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image
              source={APP_ICON}
              style={styles.headerLogo}
              defaultSource={APP_ICON}
            />
            <Text style={styles.headerTitle}>NadoBeep</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              style={styles.headerIconButton}
            >
              {notificationsEnabled ? (
                <Bell size={24} color="#fff" />
              ) : (
                <BellOff size={24} color="#fffa" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSoundToggle}
              style={styles.headerIconButton}
            >
              {soundEnabled ? (
                <Volume2 size={24} color="#fff" />
              ) : (
                <VolumeX size={24} color="#fffa" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.listWrapper}>
        <BlurView intensity={80} tint="light" style={styles.filterInfo}>
          <Text style={styles.filterText}>
            Showing only: Tornado, Flash Flood, and Severe Thunderstorm Warnings
          </Text>
          <Text style={styles.refreshText}>Auto-refreshes every 15 seconds</Text>
        </BlurView>

        {alerts.length === 0 ? (
          <View style={styles.centered}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1561484930-998b6a7b22e8?q=80&w=400&auto=format&fit=crop',
              }}
              style={styles.placeholderImage}
            />
            <Text style={styles.noAlertsText}>
              No active filtered alerts at this time
            </Text>
            <Text style={styles.noAlertsSubtext}>
              That's good news! Stay safe out there.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : Platform.OS === 'web' ? (
          <WebAlertGrid alerts={alerts} onPress={handleAlertPress} />
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.properties.id}
            renderItem={({ item }) => (
              <AlertItem alert={item} onPress={handleAlertPress} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#e74c3c']}
                tintColor="#e74c3c"
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}
