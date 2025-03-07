import { StyleSheet, View, Text, ScrollView, Image, Linking, TouchableOpacity, Platform, Switch, ActivityIndicator } from 'react-native';
import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, Github, Info, Twitter, AlertTriangle, Bug } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, FONTS } from '@/constants/theme';
import { useAlertsContext } from '@/context/AlertsContext';
import { showNotification } from '@/services/notificationService';
import { playAlarmSound, stopAlarmSound } from '@/services/soundService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_ICON = require('../../assets/images/icon.png');
import { version as appVersion } from '../../package.json';
// Import app version from package.json
const VERSION = appVersion;
const isWeb = Platform.OS === 'web';

export default function AboutScreen() {
  const [testingSound, setTestingSound] = useState(false);
  const { 
    state: { isSoundEnabled, soundVolume, notificationsEnabled },
    toggleSound,
    toggleNotifications
  } = useAlertsContext();
  
  const handleToggleNotifications = useCallback(async (value: boolean) => {
    await toggleNotifications();
  }, [toggleNotifications]);
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't open link", err));
  };

  // Test tornado warning notification and sound
  const testTornadoWarning = async () => {
    try {
      setTestingSound(true);
      
      // Show test notification
      await showNotification(
        'Test Tornado Warning',
        'This is a TEST tornado warning notification.',
        'test-tornado-warning',
        true
      );
      
      // Play alarm sound if enabled
      if (isSoundEnabled) {
        await playAlarmSound(soundVolume);
        
        // Stop the sound after 5 seconds
        setTimeout(() => {
          stopAlarmSound();
          setTestingSound(false);
        }, 5000);
      } else {
        setTestingSound(false);
      }
    } catch (error) {
      console.error('Error testing tornado warning:', error);
      setTestingSound(false);
    }
  };

  // Reset all seen alerts
  const resetSeenAlerts = async () => {
    try {
      await AsyncStorage.removeItem('seenAlerts');
      // Show confirmation
      await showNotification(
        'Alerts Reset',
        'Your alert history has been cleared. You will receive notifications again for any active alerts.',
        'alerts-reset',
        false
      );
    } catch (error) {
      console.error('Error resetting seen alerts:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appInfo}>
          <Image
            source={APP_ICON}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={styles.appName}>NadoBeep</Text>
          <Text style={styles.version}>Version {VERSION}</Text>

          <View style={styles.tagline}>
            <Info size={16} color={COLORS.text.secondary} />
            <Text style={styles.taglineText}>
              Real-time severe weather alerts
            </Text>
          </View>
        </View>

        <View style={[styles.section, styles.warningSection]}>
          <AlertTriangle size={24} color="#e74c3c" />
          <Text style={styles.warningTitle}>IMPORTANT SAFETY NOTICE</Text>
          <Text style={styles.paragraph}>
            This app is for informational purposes only and should NOT be used
            as your primary source for weather alerts. Always follow official
            guidance from local emergency management officials during severe
            weather events.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Status</Text>
          <View style={styles.monitoringControl}>
            <View style={styles.monitoringTextContainer}>
              <Text style={styles.monitoringTitle}>
                {isWeb ? 'Web Notifications' : 'Background Notifications'}
              </Text>
              <Text style={styles.monitoringDescription}>
                {isWeb
                  ? notificationsEnabled
                    ? "Enabled - You'll receive alerts when this tab is open"
                    : "Disabled - You won't receive notifications"
                  : notificationsEnabled
                  ? 'Enabled - You will be notified of severe weather alerts'
                  : 'Disabled - You will not be notified of alerts'}
              </Text>
              {isWeb && (
                <Text style={styles.webNoticeText}>
                  Note: Web notifications only work when this tab is open
                </Text>
              )}
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#d3d3d3', true: '#e74c3c88' }}
              thumbColor={notificationsEnabled ? '#e74c3c' : '#f4f3f4'}
            />
          </View>

          <View style={styles.monitoringControl}>
            <View style={styles.monitoringTextContainer}>
              <Text style={styles.monitoringTitle}>Alarm Sound</Text>
              <Text style={styles.monitoringDescription}>
                {isSoundEnabled
                  ? 'Enabled - Alarm will sound for tornado warnings'
                  : 'Disabled - No sound will play'}
              </Text>
              {isWeb && (
                <Text style={styles.webNoticeText}>
                  Note: Web browsers may require interaction before playing
                  sound
                </Text>
              )}
            </View>
            <Switch
              value={isSoundEnabled}
              onValueChange={toggleSound}
              trackColor={{ false: '#d3d3d3', true: '#e74c3c88' }}
              thumbColor={isSoundEnabled ? '#e74c3c' : '#f4f3f4'}
            />
          </View>

          {!notificationsEnabled && (
            <View style={styles.monitoringWarning}>
              <AlertTriangle size={18} color="#e67e22" />
              <Text style={styles.monitoringWarningText}>
                {isWeb
                  ? "Web notifications are disabled. You won't be notified of new alerts."
                  : 'Background notifications are disabled. You may miss important weather alerts.'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This App</Text>
          <Text style={styles.paragraph}>
            NadoBeep monitors the National Weather Service API for severe
            weather alerts, focusing specifically on county-based alerts with
            polygon geometries such as Tornado Warnings, Flood Warnings, Severe
            Warnings, and other critical alerts.
          </Text>
          <Text style={styles.paragraph}>
            When a severe weather alert is detected, the app will notify you
            immediately with details about the alert. Tornado warnings trigger a
            special alarm sound to ensure you're alerted even if you're not
            looking at your device.
          </Text>
          {isWeb && (
            <Text style={[styles.paragraph, styles.webFeatureNote]}>
              On web browsers, notifications will only appear when this tab is
              open and active. For reliable background notifications, consider
              installing the mobile app.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.paragraph}>
            • Fetches alerts from the NWS API every 30 seconds
          </Text>
          <Text style={styles.paragraph}>
            • Filters for county-based alerts with polygon geometries
          </Text>
          <Text style={styles.paragraph}>
            • Displays notifications for new alerts
          </Text>
          <Text style={styles.paragraph}>
            • Plays alarm sound for tornado warnings
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supported Alert Types</Text>
          <View style={styles.alertsList}>
            <Text style={styles.alertType}>• Tornado Warning</Text>
            <Text style={styles.alertType}>
              • Flash Flood Warning & Statement
            </Text>
            <Text style={styles.alertType}>• Flood Warning & Statement</Text>
            <Text style={styles.alertType}>• Severe Thunderstorm Warning</Text>
            <Text style={styles.alertType}>• Special Marine Warning</Text>
            <Text style={styles.alertType}>• Severe Weather Statement</Text>
            <Text style={styles.alertType}>• Snow Squall Warning</Text>
            <Text style={styles.alertType}>
              • Dust Storm Warning & Advisory
            </Text>
            <Text style={styles.alertType}>• Extreme Wind Warning</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Functions</Text>
          <TouchableOpacity
            style={[styles.testButton, testingSound && styles.testingButton]}
            onPress={testTornadoWarning}
            disabled={testingSound}
          >
            {testingSound ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.testButtonIcon}
                />
                <Text style={styles.testButtonText}>
                  Testing (5 seconds)...
                </Text>
              </>
            ) : (
              <>
                <Bug size={18} color="#fff" style={styles.testButtonIcon} />
                <Text style={styles.testButtonText}>Test Tornado Warning</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.testDescription}>
            This will play the tornado warning sound for 5 seconds and show a
            test notification.
            {isWeb
              ? ' On web browsers, this may require user interaction first.'
              : ''}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Source</Text>
          <Text style={styles.paragraph}>
            All weather alert data is sourced from the National Weather Service
            (NWS) API.
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openLink('https://www.weather.gov/')}
          >
            <Text style={styles.linkText}>Visit National Weather Service</Text>
            <ExternalLink size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* {isWeb && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get the App</Text>
            <Text style={styles.paragraph}>
              For the best experience and background notifications, download the
              native app for your device.
            </Text>
            <View style={styles.appStoreButtons}>
              <TouchableOpacity
                style={[styles.storeButton, styles.appStoreButton]}
                onPress={() =>
                  openLink(
                    'https://apps.apple.com/us/app/nadobeep/id1234567890'
                  )
                }
              >
                <Text style={styles.storeButtonText}>App Store</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.storeButton, styles.playStoreButton]}
                onPress={() =>
                  openLink(
                    'https://play.google.com/store/apps/details?id=com.nadobeep.app'
                  )
                }
              >
                <Text style={styles.storeButtonText}>Play Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ♥ for weather safety</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                openLink('https://github.com/rubynouille/NadoBeepExpo')
              }
            >
              <Github size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://x.com/RubyNouille')}
            >
              <Twitter size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Add new styles for the additional elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  taglineText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text.secondary,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  warningSection: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text.primary,
    marginBottom: 10,
    lineHeight: 22,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginRight: 6,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.text.primary,
  },
  statusValue: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.text.secondary,
  },
  alertsList: {
    marginTop: 8,
  },
  alertType: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  testButtonIcon: {
    marginRight: 8,
  },
  testDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  monitoringControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monitoringTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  monitoringTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  monitoringDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
  },
  monitoringWarning: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  monitoringWarningText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#e67e22',
    marginLeft: 8,
    flex: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginLeft: 6,
  },
  resetButtonIcon: {
    marginRight: 4,
  },
  resetDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  forceResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',  // Red color for more aggressive action
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  testingButton: {
    backgroundColor: '#7f8c8d',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontFamily: FONTS.medium,
    marginTop: 16,
  },
  webNoticeText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.text.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  
  webFeatureNote: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB74D',
    fontSize: 13,
    fontStyle: 'italic',
  },
  
  appStoreButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  
  storeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginHorizontal: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  
  appStoreButton: {
    backgroundColor: '#007AFF',
  },
  
  playStoreButton: {
    backgroundColor: '#4CAF50',
  },
  
  storeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
});
