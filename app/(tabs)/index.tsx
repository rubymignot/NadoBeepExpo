import React, { useEffect, useState, useCallback } from 'react';
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
import { getNotifiedAlerts, addNotifiedAlert } from '../../utils/notificationStorage';

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const notifiedAlertsRef = React.useRef<Set<string>>(new Set());
  const lastRefreshTime = React.useRef<number>(Date.now());
  const router = useRouter();
  const [notifiedAlerts, setNotifiedAlerts] = useState<Set<string>>(new Set());
  
  const { playAlarmSound, stopAlarmSound, isPlaying, isLoaded } = useAlertSound();

  useEffect(() => {
    // Load notification history on mount
    getNotifiedAlerts().then(setNotifiedAlerts);
    
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

      // Handle tornado warnings
      const tornadoWarning = filteredAlerts.find(
        (alert) => alert.properties.event === 'Tornado Warning'
      );

      if (tornadoWarning && soundEnabled && isLoaded) {
        playAlarmSound(AlertEvent.TornadoWarning);
      } else if (!tornadoWarning && isPlaying) {
        stopAlarmSound();
      }

      // Handle notifications
      if (notificationsEnabled) {
        for (const alert of filteredAlerts) {
          if (notifiedAlerts.has(alert.properties.id)) continue;

          // Add to notification history
          await addNotifiedAlert(alert.properties.id);
          setNotifiedAlerts(prev => new Set([...prev, alert.properties.id]));
          
          const isTornado = alert.properties.event === 'Tornado Warning';
          
          if (Platform.OS === 'web') {
            const hasPermission = await requestNotificationPermission();
            if (hasPermission) {
              new window.Notification(
                alert.properties.event === 'Tornado Warning' 
                  ? '🚨 TORNADO WARNING 🚨' 
                  : alert.properties.event,
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
                data: { 
                  alertId: alert.properties.id,
                  isTornado
                },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.MAX,
                vibrate: [0, 250, 250, 250],
                color: '#e74c3c',
              },
              trigger: null,
            });
          }
        }
      }

      lastRefreshTime.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      console.error('Failed to fetch NWS alerts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [soundEnabled, notificationsEnabled, playAlarmSound, stopAlarmSound, isLoaded, isPlaying]);

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
            <Text style={styles.headerTitle}>Nado Beep</Text>
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
