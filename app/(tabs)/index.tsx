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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';

import { AlertItem } from '../../components/AlertList/AlertItem';
import { LoadingState } from '../../components/AlertList/LoadingState';
import { useAlertSound } from '../../hooks/useAlertSound';
import { useNotifications } from '../../hooks/useNotifications';
import { Alert, AlertsResponse, AlertEvent } from '../../types/alerts';
import { FILTERED_ALERT_TYPES } from '../../constants/alerts';
import { styles } from '../../styles/alerts-screen.styles';
import { WebAlertGrid } from '../../components/AlertList/WebAlertGrid';
import { useAlerts } from '../../context/AlertsContext';
import * as Device from 'expo-device';
import { useBackgroundTask } from '@/context/BackgroundTaskContext';

const APP_ICON = require('../../assets/images/icon.png');

export default function AlertsScreen() {
  const { alerts, setAlerts } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const router = useRouter();
  const [userInteracted, setUserInteracted] = useState(false);
  const { isTaskRegistered, registerTask } = useBackgroundTask();
  
  const { playAlarmSound, stopAlarmSound, isPlaying, isLoaded, volume, setVolume } = useAlertSound();
  
  const { 
    notificationsEnabled, 
    toggleNotifications, 
    handleAlertNotifications,
    handleManualRefresh,
    registerAlertsWithoutNotification,
  } = useNotifications({
    soundEnabled,
    playAlarmSound,
    stopAlarmSound
  });

  // Track if we've done initial load
  const initialLoadDone = useRef<boolean>(false);

  // Ensure background task is registered
  useEffect(() => {
    if (Platform.OS !== 'web' && Device.isDevice && !isTaskRegistered) {
      registerTask();
    }
  }, [isTaskRegistered, registerTask]);

  // Fetch alerts function
  const fetchAlerts = useCallback(async (isManualRefresh = false) => {
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
      
      // Process notifications differently based on context
      if (!initialLoadDone.current) {
        // For initial load, register alerts without showing notifications
        initialLoadDone.current = true;
        await registerAlertsWithoutNotification(filteredAlerts);
      } else if (isManualRefresh) {
        // For manual refresh, only show notifications for alerts newer than the last refresh
        await handleManualRefresh(filteredAlerts);
      } else {
        // For auto refresh, show notifications for any unnotified alerts
        await handleAlertNotifications(filteredAlerts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      console.error('Failed to fetch NWS alerts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setAlerts, handleAlertNotifications, handleManualRefresh, registerAlertsWithoutNotification]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    }

    // Initial fetch 
    fetchAlerts(false);
    
    // When app is in foreground, we use this interval
    // Background task handles the fetching when app is closed
    const intervalId = setInterval(() => {
      fetchAlerts(false);
    }, 15000);

    return () => {
      clearInterval(intervalId);
      stopAlarmSound();
    };
  }, [fetchAlerts, stopAlarmSound]);

  // Manually trigger refresh with appropriate flag
  const onRefresh = () => {
    setRefreshing(true);
    // This is a manual refresh
    fetchAlerts(true);
  };

  const handleAlertPress = (alert: Alert) => {
    router.push({
      pathname: '/(tabs)/alert-details',
      params: { alertId: alert.properties.id },
    });
  };

  // Fixed sound initialization on first user interaction
  const initializeSound = useCallback(async () => {
    if (!userInteracted) {
      setUserInteracted(true);
      if (Platform.OS === 'web') {
        try {
          // Create and immediately suspend a short silent audio context
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContext.suspend();
          
          // Resume audio context on next user interaction
          const resumeAudio = () => {
            audioContext.resume().catch(console.error);
            document.removeEventListener('touchstart', resumeAudio);
            document.removeEventListener('click', resumeAudio);
          };
          
          document.addEventListener('touchstart', resumeAudio, { once: true });
          document.addEventListener('click', resumeAudio, { once: true });
        } catch (error) {
          console.error("Failed to initialize audio context:", error);
        }
      }
    }
  }, [userInteracted]);

  // Fixed sound toggle
  const handleSoundToggle = async () => {
    await initializeSound();
    setSoundEnabled(prev => !prev);
    if (soundEnabled && isPlaying) {
      stopAlarmSound();
    }
  };

  // Fixed mute toggle with debounce
  const toggleMute = useCallback(async () => {
    await initializeSound();
    const newVolume = volume > 0 ? 0 : 1;
    setVolume(newVolume);
  }, [initializeSound, volume, setVolume]);

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
              onPress={async () => {
                await initializeSound();
                toggleNotifications();
              }}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              {notificationsEnabled ? (
                <Bell size={24} color="#fff" />
              ) : (
                <BellOff size={24} color="#fffa" />
              )}
            </TouchableOpacity>
            
            <View style={styles.volumeControl}>
              <TouchableOpacity
                onPress={toggleMute}
                style={styles.volumeIconButton}
                activeOpacity={0.7}
                disabled={false}
              >
                {volume > 0 ? (
                  <Volume2 size={18} color="#fff" />
                ) : (
                  <VolumeX size={18} color="#fffa" />
                )}
              </TouchableOpacity>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#fff"
              />
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.listWrapper}>
        <BlurView intensity={80} tint="light" style={styles.filterInfo}>
          <Text style={styles.filterText}>
            Showing only: Tornado, Flash Flood, Special Marine and Severe Thunderstorm Warnings
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
