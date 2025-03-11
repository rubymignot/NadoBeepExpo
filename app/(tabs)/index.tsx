import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Volume2, VolumeX, Bell, BellOff, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AlertItem } from '../../components/AlertList/AlertItem';
import { Alert } from '../../types/alerts';
import { WebAlertGrid } from '../../components/AlertList/WebAlertGrid';
import { FILTERED_ALERT_TYPES } from '@/constants/alerts';
import { useTheme } from '@/context/ThemeContext';
import { createThemedStyles } from '@/styles/alerts-screen.styles';
import { useAlerts } from '@/context/AlertsContext';  // Changed from useAlertsContext
import { getRelativeTime } from '@/utils/dateUtils';
import { enableAudioPlayback, isAudioEnabled, subscribeToAudioState } from '@/services/soundService';

const APP_ICON = require('../../assets/images/icon.png');
const MOBILE_BREAKPOINT = 600; // Width threshold for hiding the title

export default function AlertsScreen() {
  const router = useRouter();
  const { isDarkMode, colors } = useTheme();
  const styles = createThemedStyles(colors);
  const { width: windowWidth } = useWindowDimensions();
  const showTitle = windowWidth > MOBILE_BREAKPOINT;
  const isMobile = windowWidth < MOBILE_BREAKPOINT;
  const isWeb = Platform.OS === 'web';
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Get context
  const { 
    state: { notificationsEnabled },
    toggleNotifications 
  } = useAlerts();

  // Setup audio state subscription
  useEffect(() => {
    if (isWeb) {
      // Initial check
      setAudioEnabled(isAudioEnabled());
      
      // Subscribe to changes
      const unsubscribe = subscribeToAudioState((enabled) => {
        setAudioEnabled(enabled);
      });
      
      // Cleanup subscription
      return () => unsubscribe();
    }
  }, []);

  // Handle enabling audio for web browsers
  const handleEnableAudio = useCallback(() => {
    enableAudioPlayback();
    setAudioEnabled(true);
    setShowFeedback(true);
    
    // Show feedback temporarily
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  }, []);

  // Handle alert press
  const handleAlertPress = useCallback((alert: Alert) => {
    console.log('Navigating to alert:', alert.properties.id);
    router.push({
      pathname: '/alert-details',
      params: { alertId: alert.properties.id }
    });
  }, [router]);

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://api.weather.gov/alerts/active', {
        headers: {
          'User-Agent': '(NadoBeep, contact@nadobeep.com)',
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      // Filter alerts here based on your criteria
      const filteredAlerts = data.features.filter((alert: any) => 
        FILTERED_ALERT_TYPES.includes(alert.properties.event) &&
        alert.geometry && 
        alert.geometry.type === 'Polygon'
      );
      
      setAlerts(filteredAlerts);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle refresh - pull to refresh
  const onRefresh = useCallback(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Format the filter types for display
  const getFilterTypesString = () => {
    const eventNames = FILTERED_ALERT_TYPES.map(type => 
      type.replace('Warning', '').replace('Statement', '').trim()
    );
    const uniqueEvents = [...new Set(eventNames)];
    return uniqueEvents.join(', ') + ' Alerts';
  };

  // Get the appropriate update time string
  const getUpdateTimeString = () => {
    if (!lastUpdate) return 'Never updated';
    return `Last updated ${getRelativeTime(lastUpdate)}`;
  };

  // Load alerts on component mount
  React.useEffect(() => {
    fetchAlerts();
    
    // Set up polling interval
    const intervalId = setInterval(fetchAlerts, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchAlerts]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#ff6b6b', '#c0392b'] : ['#e74c3c', '#c0392b']}
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
          
          {/* Audio enable button for web browsers */}
          {isWeb && (
            <View style={styles.audioEnableContainer}>
              <TouchableOpacity
                style={[
                  styles.audioEnableButton,
                  audioEnabled && styles.audioEnabledButton
                ]}
                onPress={handleEnableAudio}
                disabled={audioEnabled}
              >
                <Volume2 size={20} color="#fff" />
                {showTitle && (
                  <Text style={styles.audioEnableButtonText}>
                  {audioEnabled ? 'Audio Enabled' : 'Enable Alert Sounds'}
                  </Text>
                )}
                {audioEnabled && (
                  <CheckCircle size={16} color="#fff" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.listWrapper}>
        <BlurView 
          intensity={80} 
          tint={isDarkMode ? "dark" : "light"} 
          style={styles.filterInfo}
        >
          <Text style={styles.filterText}>
            Showing only: {getFilterTypesString()}
          </Text>
          <Text style={styles.refreshText}>{getUpdateTimeString()}</Text>
        </BlurView>

        {isLoading && alerts.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#e74c3c" />
            <Text style={styles.loadingText}>Checking for alerts...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <AlertTriangle size={50} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchAlerts}
            >
              <Text style={styles.refreshButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : alerts.length === 0 ? (
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
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchAlerts}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : isWeb ? (
          <WebAlertGrid alerts={alerts} onPress={handleAlertPress} />
        ) : (
          <FlatList<Alert>
            data={alerts}
            keyExtractor={(item) => item.properties.id}
            renderItem={({item}) => (
              <AlertItem alert={item} onPress={handleAlertPress} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={onRefresh}
                colors={['#e74c3c']}
                tintColor="#e74c3c"
              />
            }
          />
        )}
      </View>
    </View>
  );
}
