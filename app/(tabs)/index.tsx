import React, { useCallback, useState } from 'react';
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
import Slider from '@react-native-community/slider';

import { AlertItem } from '../../components/AlertList/AlertItem';
import { Alert } from '../../types/alerts';
import { WebAlertGrid } from '../../components/AlertList/WebAlertGrid';
import { FILTERED_ALERT_TYPES } from '@/constants/alerts';
import { styles } from '../../styles/alerts-screen.styles';
import { useAlertsContext } from '@/context/AlertsContext';
import { getRelativeTime } from '@/utils/dateUtils';
import { requestNotificationPermissions } from '@/services/notificationService';
import { enableAudioPlayback } from '@/services/soundService';

const APP_ICON = require('../../assets/images/icon.png');
const MOBILE_BREAKPOINT = 600; // Width threshold for hiding the title

export default function AlertsScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const showTitle = windowWidth > MOBILE_BREAKPOINT;
  const isMobile = windowWidth < MOBILE_BREAKPOINT;
  const isWeb = Platform.OS === 'web';
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Get context
  const { 
    state: { 
      alerts, 
      isLoading, 
      error, 
      lastUpdate, 
      isSoundEnabled, 
      soundVolume, 
      notificationsEnabled 
    },
    fetchAlerts,
    toggleSound,
    setSoundVolume,
    toggleNotifications
  } = useAlertsContext();

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

  // Handle refresh - pull to refresh
  const onRefresh = useCallback(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      // Request permissions when enabling
      const permitted = await requestNotificationPermissions();
      if (permitted) {
        toggleNotifications();
      } else {
        // Show some feedback that permissions were denied
        console.log('Notification permissions denied');
      }
    } else {
      // Just toggle off if already enabled
      toggleNotifications();
    }
  };

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
                <Text style={styles.audioEnableButtonText}>
                  {audioEnabled ? 'Audio Enabled' : 'Enable Alert Sounds'}
                </Text>
                {audioEnabled && (
                  <CheckCircle size={16} color="#fff" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.listWrapper}>
        <BlurView intensity={80} tint="light" style={styles.filterInfo}>
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
