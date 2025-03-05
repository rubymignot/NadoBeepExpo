import React, { useCallback } from 'react';
import { View, Text, ScrollView, Linking, TouchableOpacity, Image, Platform } from 'react-native';
import { ExternalLink, TriangleAlert as AlertTriangle, Info, Volume2, Bell, Bug, RefreshCw } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useAlertSound } from '../../hooks/useAlertSound';
import { styles } from '@/styles/about.styles';
import { AlertEvent } from '../../types/alerts';
import { useAlerts } from '../../context/AlertsContext';
import { createTestTornadoWarning } from '../../utils/testAlerts';

export default function AboutScreen() {
  const { playAlarmSound, stopAlarmSound } = useAlertSound();
  const { addTemporaryAlert } = useAlerts();

  // Add test notification functionality
  const testTornadoWarning = useCallback(async () => {
    try {
      // Create a test alert
      const testAlert = createTestTornadoWarning();
      
      // Add the test alert to the UI
      addTemporaryAlert(testAlert, 10000); // Will be automatically removed after 10 seconds
      
      // Play the tornado warning sound
      await playAlarmSound(AlertEvent.TornadoWarning);
      
      // Schedule a test notification
      if (Platform.OS === 'web' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new window.Notification('🚨 TEST: TORNADO WARNING 🚨', {
            body: 'This is a TEST notification. In a real event, take shelter immediately.',
            icon: '/notification-icon.png',
            tag: 'test-tornado-warning',
          });
        }
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 TEST: TORNADO WARNING 🚨',
            body: 'This is a TEST notification. In a real event, take shelter immediately.',
            data: { 
              alertId: testAlert.properties.id,
              isTornado: true,
              isTest: true
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 250, 250, 250],
            color: '#e74c3c',
          },
          trigger: null, // Send immediately
        });
      }
      
      // Stop the sound after a few seconds
      setTimeout(() => {
        stopAlarmSound();
      }, 5000);
    } catch (error) {
      console.error('Error testing tornado warning:', error);
    }
  }, [playAlarmSound, stopAlarmSound, addTemporaryAlert]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={Platform.OS !== 'web'}
    >
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.headerLogo} />
          <Text style={styles.headerTitle}>NadoBeep</Text>
        </View>

        <View style={styles.section}>
          <Info size={40} color="#e74c3c" style={styles.icon} />
          <Text style={styles.title}>About NadoBeep</Text>
                    <Text style={styles.description}>
                    NadoBeep displays real-time severe weather information from the official National Weather Service data. It also goes BEEP BEEP when there's a tornado warning!
                    Note that NadoBeep is NOT an official warning app and should not be your primary source for weather alerts.
                    </Text>
        </View>

        <View style={styles.imageSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=800&auto=format&fit=crop' }}
            style={styles.featureImage} />
          <Text style={styles.imageCaption}>Stay safe with real-time severe weather alerts</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Types</Text>

          <View style={styles.alertTypeItem}>
            <View style={[styles.alertTypeDot, { backgroundColor: '#7b241c' }]} />
            <View style={styles.alertTypeContent}>
              <Text style={styles.alertTypeTitle}>Tornado Warning</Text>
              <Text style={styles.alertTypeDescription}>
                A tornado has been sighted or indicated by weather radar. Take shelter immediately.
              </Text>
            </View>
          </View>

          <View style={styles.alertTypeItem}>
            <View style={[styles.alertTypeDot, { backgroundColor: '#1a5276' }]} />
            <View style={styles.alertTypeContent}>
              <Text style={styles.alertTypeTitle}>Flash Flood Warning</Text>
              <Text style={styles.alertTypeDescription}>
                Flash flooding is in progress, imminent, or highly likely. Seek higher ground.
              </Text>
            </View>
          </View>

          <View style={styles.alertTypeItem}>
            <View style={[styles.alertTypeDot, { backgroundColor: '#6c3483' }]} />
            <View style={styles.alertTypeContent}>
              <Text style={styles.alertTypeTitle}>Severe Thunderstorm Warning</Text>
              <Text style={styles.alertTypeDescription}>
                A thunderstorm with damaging winds and/or large hail is occurring or imminent.
              </Text>
            </View>
          </View>

          <View style={styles.alertTypeItem}>
            <View style={[styles.alertTypeDot, { backgroundColor: '#2980b9' }]} />
            <View style={styles.alertTypeContent}>
              <Text style={styles.alertTypeTitle}>Special Marine Warning</Text>
              <Text style={styles.alertTypeDescription}>
                Potentially hazardous marine conditions including winds, thunderstorms, or waterspouts affecting coastal waters.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>

          <View style={styles.featureItem}>
            <Bell size={24} color="#e74c3c" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Push Notifications</Text>
              <Text style={styles.featureDescription}>
                Receive immediate push notifications for tornado warnings and other severe weather alerts, even when your device is locked.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Volume2 size={24} color="#e74c3c" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Tornado Alarm</Text>
              <Text style={styles.featureDescription}>
                When a Tornado Warning is active anywhere in the United States, this app will sound an alarm to alert you, even if your device is on silent mode.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <AlertTriangle size={24} color="#e74c3c" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Real-time Updates</Text>
              <Text style={styles.featureDescription}>
                Data refreshes automatically every 15 seconds to ensure you have the most current information during severe weather events.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Tools</Text>
          <View style={styles.debugSection}>
            <Bug size={24} color="#e74c3c" style={styles.debugIcon} />
            <Text style={styles.debugText}>
              Test the tornado warning notification and alarm system
            </Text>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={testTornadoWarning}
            >
              <Text style={styles.debugButtonText}>Test Tornado Warning</Text>
            </TouchableOpacity>
            <Text style={styles.debugDisclaimer}>
              This will trigger a test notification and sound the alarm for 5 seconds
            </Text>
          </View>
        </View>

        <View style={styles.imageSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?q=80&w=800&auto=format&fit=crop' }}
            style={styles.featureImage} />
          <Text style={styles.imageCaption}>Tornado warnings demand immediate action</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Severity Levels</Text>

          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#7b241c' }]} />
            <View style={styles.severityContent}>
              <Text style={styles.severityTitle}>Extreme</Text>
              <Text style={styles.severityDescription}>
                Extraordinary threat to life or property
              </Text>
            </View>
          </View>

          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#c0392b' }]} />
            <View style={styles.severityContent}>
              <Text style={styles.severityTitle}>Severe</Text>
              <Text style={styles.severityDescription}>
                Significant threat to life or property
              </Text>
            </View>
          </View>

          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#e67e22' }]} />
            <View style={styles.severityContent}>
              <Text style={styles.severityTitle}>Moderate</Text>
              <Text style={styles.severityDescription}>
                Possible threat to life or property
              </Text>
            </View>
          </View>

          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#f1c40f' }]} />
            <View style={styles.severityContent}>
              <Text style={styles.severityTitle}>Minor</Text>
              <Text style={styles.severityDescription}>
                Minimal or no known threat to life or property
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AlertTriangle size={24} color="#e74c3c" style={styles.warningIcon} />
          <Text style={styles.warningTitle}>Important Safety Notice</Text>
          <Text style={styles.warningText}>
            This app is for informational purposes only. Always follow official guidance from local emergency management officials during severe weather events.
          </Text>
          <Text style={styles.warningText}>
            Do not rely solely on this app for life-threatening weather situations. Have multiple ways to receive warnings and know your safe place.
          </Text>
        </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Data Source</Text>
      <Text style={styles.description}>
        All weather alert data is sourced directly from the official National Weather Service API.
        The app automatically refreshes data every 15 seconds to ensure you have the most up-to-date information.
      </Text>
      <TouchableOpacity
        style={styles.link}
        onPress={() => Linking.openURL('https://api.weather.gov/')}
      >
        <Text style={styles.linkText}>NWS API Documentation</Text>
        <ExternalLink size={16} color="#3498db" />
      </TouchableOpacity>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Additional Resources</Text>
      <TouchableOpacity
        style={styles.link}
        onPress={() => Linking.openURL('https://www.weather.gov/')}
      >
        <Text style={styles.linkText}>National Weather Service</Text>
        <ExternalLink size={16} color="#3498db" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => Linking.openURL('https://www.spc.noaa.gov/')}
      >
        <Text style={styles.linkText}>Storm Prediction Center</Text>
        <ExternalLink size={16} color="#3498db" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => Linking.openURL('https://www.fema.gov/')}
      >
        <Text style={styles.linkText}>Federal Emergency Management Agency</Text>
        <ExternalLink size={16} color="#3498db" />
      </TouchableOpacity>
    </View>

    <View style={styles.footer}>
        <Text style={styles.footerText}>
          NadoBeep • Version 1.0.0
        </Text>
        <Text style={styles.footerText}>
          Created with Expo and React Native
        </Text>
        <Text style={styles.footerText}>
          © 2025 NadoBeep
        </Text>
      </View>
      </View>
    </ScrollView>
  );
}