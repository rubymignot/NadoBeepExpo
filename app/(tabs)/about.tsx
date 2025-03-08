import { View, Text, ScrollView, Image, Linking, TouchableOpacity, Platform, Switch, ActivityIndicator } from 'react-native';
import React, { useCallback, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, Github, Info, Twitter, AlertTriangle, Bug, Shield, Battery, RefreshCw } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import { useAlerts } from '@/context/AlertsContext';
import { playAlarmSound, stopAlarmSound } from '@/services/soundService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { checkAlertsNow, isForegroundServiceRunning, startForegroundService, stopForegroundService } from '@/services/foregroundService';
import { version as appVersion } from '../../package.json';
import { showAlertNotification } from '@/services/notifeeService';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  isBrowserNotificationSupported
} from '@/services/webNotificationService';
import { styles } from '@/styles/about.styles';
import { COLORS } from '@/constants/theme';

const APP_ICON = require('../../assets/images/icon.png');
const VERSION = appVersion;
const isWeb = Platform.OS === 'web';

export default function AboutScreen() {
  const router = useRouter();
  const [testingSound, setTestingSound] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isRestartingService, setIsRestartingService] = useState(false);
  const [versionTapCount, setVersionTapCount] = useState(0); // For hidden debug access
  const [canModifyBattery, setCanModifyBattery] = useState(false);
  const [manufacturerInfo, setManufacturerInfo] = useState<{
    hasSpecialRequirements: boolean;
    manufacturer: string | null;
    instructions: string;
  } | null>(null);
  const [webNotificationPermission, setWebNotificationPermission] = useState<string | null>(null);
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);
  const { 
    state: { isSoundEnabled, soundVolume, notificationsEnabled },
    toggleSound,
    toggleNotifications
  } = useAlerts();
  
  // Check device manufacturer and set battery optimization info
  useEffect(() => {
    const checkDeviceManufacturer = async () => {
      if (Platform.OS === 'android') {
        const manufacturer = await Device.manufacturer;
        setCanModifyBattery(true);
        
        // Set manufacturer-specific instructions
        if (manufacturer) {
          const lowerManufacturer = manufacturer.toLowerCase();
          
          if (lowerManufacturer.includes('xiaomi') || 
              lowerManufacturer.includes('redmi') || 
              lowerManufacturer.includes('poco')) {
            setManufacturerInfo({
              hasSpecialRequirements: true,
              manufacturer: 'Xiaomi/Redmi/Poco',
              instructions: '1. Find NadoBeep in the apps list\n2. Select "Battery"\n3. Choose "No restrictions"\n4. Also disable "Battery optimization"'
            });
          } else if (lowerManufacturer.includes('huawei')) {
            setManufacturerInfo({
              hasSpecialRequirements: true,
              manufacturer: 'Huawei',
              instructions: '1. Go to Battery settings\n2. Select "App launch"\n3. Find NadoBeep\n4. Enable "Auto-launch" and "Secondary launch"'
            });
          } else if (lowerManufacturer.includes('samsung')) {
            setManufacturerInfo({
              hasSpecialRequirements: true,
              manufacturer: 'Samsung',
              instructions: '1. Select "Battery optimization"\n2. Select "All apps"\n3. Find NadoBeep\n4. Choose "Don\'t optimize"'
            });
          } else if (lowerManufacturer.includes('oppo') || 
                     lowerManufacturer.includes('realme') || 
                     lowerManufacturer.includes('oneplus')) {
            setManufacturerInfo({
              hasSpecialRequirements: true,
              manufacturer: manufacturer,
              instructions: '1. Go to Settings > Battery\n2. Find "Background app management"\n3. Find NadoBeep\n4. Choose "Don\'t restrict"'
            });
          } else {
            setManufacturerInfo({
              hasSpecialRequirements: false,
              manufacturer: manufacturer,
              instructions: 'Select "Not optimized" or "Don\'t optimize" for NadoBeep in your battery settings.'
            });
          }
        }
      }
    };
    
    checkDeviceManufacturer();
  }, []);

  // Check web notification permission on mount
  useEffect(() => {
    if (Platform.OS === 'web' && isBrowserNotificationSupported()) {
      getNotificationPermission().then(permission => {
        setWebNotificationPermission(permission);
      });
    }
  }, []);

  // Fetch service status on component mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      fetchServiceStatus();
    }
  }, []);
  
  useEffect(() => {
    if (Platform.OS === 'web' && isBrowserNotificationSupported()) {
      getNotificationPermission().then(permission => {
        setWebNotificationPermission(permission);
        
        // If permission is granted but notifications are disabled, show a hint
        if (permission === 'granted' && !notificationsEnabled) {
          console.log('Notification permission granted but notifications are disabled');
        }
      });
    }
  }, [notificationsEnabled]);
  
  const handleToggleNotifications = useCallback(async (value: boolean) => {
    await toggleNotifications();
  }, [toggleNotifications]);
  
  const handleToggleSound = useCallback(async (value: boolean) => {
    await toggleSound();
  }, [toggleSound]);
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't open link", err));
  };

  // Request web notification permission
  const handleRequestWebPermission = async () => {
    if (Platform.OS === 'web' && isBrowserNotificationSupported()) {
      const granted = await requestNotificationPermission();
      const currentPermission = await getNotificationPermission();
      setWebNotificationPermission(currentPermission);
      
      if (granted) {
        // Enable notifications if permission was granted
        toggleNotifications();
      }
    }
  };

  // Fetch background service status
  const fetchServiceStatus = async () => {
    if (Platform.OS !== 'android') return;
    
    try {
      setIsLoadingStatus(true);
      
      // Check if service is running
      const isRunning = await isForegroundServiceRunning();
      
      // Get other diagnostic information
      const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled') === 'true';
      const fetchStatus = await AsyncStorage.getItem('lastFetchStatus') || 'Unknown';
      const serviceStartTime = await AsyncStorage.getItem('serviceStartTime');
      const lastUpdateTime = await AsyncStorage.getItem('lastUpdateTime');
      const backgroundIntervalActive = await AsyncStorage.getItem('backgroundIntervalActive') === 'true';
      const lastSuccessfulFetch = await AsyncStorage.getItem('lastSuccessfulFetch');
      const errorCount = await AsyncStorage.getItem('fetchErrorCount') || '0';
      const notificationCount = await AsyncStorage.getItem('notificationCount') || '0';
      const lastForegroundServiceRun = await AsyncStorage.getItem('last_foreground_service_run');
      
      // Get device info
      const deviceType = Device.deviceName || 'Unknown device';
      const platform = Device.osName || 'Android';
      const osVersion = Device.osVersion || 'Unknown version';
      
      setServiceStatus({
        taskRegistered: isRunning,
        notificationsEnabled,
        fetchStatus,
        serviceStartTime,
        lastUpdateTime,
        backgroundIntervalActive,
        lastSuccessfulFetch,
        errorCount: parseInt(errorCount, 10),
        notificationCount: parseInt(notificationCount, 10),
        lastForegroundServiceRun,
        deviceType,
        platform,
        osVersion
      });
    } catch (error) {
      console.error('Error fetching service status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };
  
  // Restart the background service
  const handleServiceRestart = async () => {
    if (Platform.OS !== 'android') return;
    
    try {
      setIsRestartingService(true);
      
      // Stop the service if it's running
      await stopForegroundService();
      
      // Short delay to ensure clean shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start the service again
      await startForegroundService();
      
      // Store the current time as service start time
      await AsyncStorage.setItem('serviceStartTime', new Date().toISOString());
      
      // Refresh status
      await fetchServiceStatus();
      
      // Show success notification
      await showAlertNotification(
        'Service Restarted',
        'The background monitoring service has been restarted.',
        'service-restart',
        false
      );
    } catch (error) {
      console.error('Error restarting service:', error);
    } finally {
      setIsRestartingService(false);
    }
  };
  
  // Open battery optimization settings
  const handleOpenBatterySettings = () => {
    if (Platform.OS !== 'android') return;
    
    try {
      // This will open battery optimization settings on most Android devices
      Linking.openSettings();
      
      // For newer Android versions, we can try to open battery optimization directly
      // but this may not work on all devices
      try {
        Linking.openURL('android:///settings/battery').catch(() => {
          // If direct battery URL fails, we've already opened general settings above
          console.log('Could not open battery settings directly');
        });
      } catch (error) {
        console.log('Error opening battery settings URL:', error);
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  // Test tornado warning notification and sound
  const testTornadoWarning = async () => {
    try {
      setTestingSound(true);
      
      // Show test notification
      await showAlertNotification(
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
      await showAlertNotification(
        'Alerts Reset',
        'Your alert history has been cleared. You will receive notifications again for any active alerts.',
        'alerts-reset',
        false
      );
    } catch (error) {
      console.error('Error resetting seen alerts:', error);
    }
  };

  // Handle checking alerts now
  const handleCheckAlertsNow = async () => {
    if (Platform.OS !== 'android') return;
    
    try {
      setIsCheckingAlerts(true);
      
      // Check alerts
      const result = await checkAlertsNow();
      
      // Show toast or notification about the result
      if (result) {
        await showAlertNotification(
          'Alert Check Complete',
          'Successfully checked for alerts.',
          'check-alerts-now',
          false
        );
      } else {
        await showAlertNotification(
          'Alert Check Complete',
          'No new alerts found.',
          'check-alerts-now',
          false
        );
      }
      
      // Refresh status after checking
      await fetchServiceStatus();
      
    } catch (error) {
      console.error('Error checking alerts:', error);
      await showAlertNotification(
        'Alert Check Failed',
        'There was a problem checking for alerts.',
        'check-alerts-error',
        false
      );
    } finally {
      setIsCheckingAlerts(false);
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

          {/* Add sound toggle control */}
          <View style={styles.monitoringControl}>
            <View style={styles.monitoringTextContainer}>
              <Text style={styles.monitoringTitle}>
                Alarm Sound
              </Text>
              <Text style={styles.monitoringDescription}>
                {isSoundEnabled
                  ? 'Enabled - Alarm will sound for tornado warnings'
                  : 'Disabled - No sound will play'}
              </Text>
              {isWeb && (
                <Text style={styles.webNoticeText}>
                  Note: Web browsers may require interaction before playing sound
                </Text>
              )}
            </View>
            <Switch
              value={isSoundEnabled}
              onValueChange={handleToggleSound}
              trackColor={{ false: '#d3d3d3', true: '#e74c3c88' }}
              thumbColor={isSoundEnabled ? '#e74c3c' : '#f4f3f4'}
            />
          </View>

          {/* Add web permission button if needed */}
          {isWeb && isBrowserNotificationSupported() && webNotificationPermission !== 'granted' && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestWebPermission}
            >
              <Text style={styles.permissionButtonText}>
                Request Notification Permission
              </Text>
            </TouchableOpacity>
          )}

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

        {Platform.OS === 'android' && canModifyBattery && (
          <View style={[styles.section, styles.batterySection]}>
            <View style={styles.sectionTitleContainer}>
              <Battery size={20} color="#e67e22" />
              <Text style={[styles.sectionTitle, {marginLeft: 8, marginBottom: 0}]}>
                Battery Optimization
              </Text>
            </View>
            
            <Text style={styles.paragraph}>
              For reliable background notifications on Android, this app needs to be exempt from battery optimization.
            </Text>
            
            {manufacturerInfo?.hasSpecialRequirements && (
              <View style={styles.manufacturerWarning}>
                <AlertTriangle size={18} color="#e67e22" />
                <Text style={styles.manufacturerWarningText}>
                  Your device ({manufacturerInfo.manufacturer}) requires special battery settings.
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.batteryButton} 
              onPress={handleOpenBatterySettings}
            >
              <Text style={styles.batteryButtonText}>Open Battery Settings</Text>
            </TouchableOpacity>
            
            {manufacturerInfo && (
              <Text style={styles.batteryInstructions}>
                {manufacturerInfo.instructions}
              </Text>
            )}
          </View>
        )}

        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background Service Diagnostics</Text>
            
            {isLoadingStatus ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading status...</Text>
              </View>
            ) : serviceStatus ? (
              <View style={styles.statusDetails}>
                <View style={styles.statusCard}>
                  <Text style={styles.statusCardTitle}>Service Status</Text>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Notifications: </Text>
                    <Text style={[
                      styles.statusValue, 
                      {color: serviceStatus.notificationsEnabled ? '#2ecc71' : '#e74c3c'}
                    ]}>
                      {serviceStatus.notificationsEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Service Active: </Text>
                    <Text style={[
                      styles.statusValue, 
                      {color: serviceStatus.taskRegistered ? '#2ecc71' : '#e74c3c'}
                    ]}>
                      {serviceStatus.taskRegistered ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.statusCard}>
                  <Text style={styles.statusCardTitle}>API Activity</Text>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Last Check Status: </Text>
                    <Text style={styles.statusValue}>{serviceStatus.fetchStatus || 'Unknown'}</Text>
                  </View>
                  
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>API Errors: </Text>
                    <Text style={[
                      styles.statusValue,
                      {color: serviceStatus.errorCount > 0 ? '#e74c3c' : '#2ecc71'}
                    ]}>
                      {serviceStatus.errorCount || 0}
                    </Text>
                  </View>
                  
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Notifications Sent: </Text>
                    <Text style={styles.statusValue}>{serviceStatus.notificationCount || 0}</Text>
                  </View>
                </View>
                
                <View style={styles.statusCard}>
                  <Text style={styles.statusCardTitle}>Timestamps</Text>
                  {serviceStatus.serviceStartTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Service Started: </Text>
                      <Text style={styles.statusValue}>
                        {new Date(serviceStatus.serviceStartTime).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  
                  {serviceStatus.lastUpdateTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Last Check: </Text>
                      <Text style={styles.statusValue}>
                        {new Date(serviceStatus.lastUpdateTime).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  
                  {serviceStatus.lastSuccessfulFetch && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Last Successful: </Text>
                      <Text style={styles.statusValue}>
                        {new Date(serviceStatus.lastSuccessfulFetch).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  
                  {serviceStatus.lastForegroundServiceRun && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Service Run: </Text>
                      <Text style={styles.statusValue}>
                        {new Date(parseInt(serviceStatus.lastForegroundServiceRun)).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Device: </Text>
                  <Text style={styles.statusValue}>
                    {serviceStatus.deviceType} ({serviceStatus.platform} {serviceStatus.osVersion})
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.paragraph}>Status information not available.</Text>
            )}
            
            <View style={styles.serviceControls}>
              <TouchableOpacity 
                style={styles.serviceButton} 
                onPress={fetchServiceStatus}
                disabled={isLoadingStatus}
              >
                <RefreshCw size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.serviceButtonText}>Refresh Status</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.serviceButton, styles.checkButton]} 
                onPress={handleCheckAlertsNow}
                disabled={isCheckingAlerts || isRestartingService}
              >
                {isCheckingAlerts ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.serviceButtonText}>Checking...</Text>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.serviceButtonText}>Check Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.serviceControls}>
              <TouchableOpacity 
                style={[styles.serviceButton, styles.restartButton, { flex: 1 }]} 
                onPress={handleServiceRestart}
                disabled={isRestartingService || isCheckingAlerts}
              >
                {isRestartingService ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.serviceButtonText}>Restarting...</Text>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.serviceButtonText}>Restart Service</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.serviceNote}>
              If you're not receiving notifications when the app is in the background, 
              try restarting the background service.
            </Text>
          </View>
        )}

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Privacy</Text>
          <Text style={styles.paragraph}>
            We don't collect any personal data. NadoBeep works without tracking your location 
            or personal information.
          </Text>
          <TouchableOpacity
            style={styles.privacyButton}
            onPress={() => router.push('/(tabs)/privacy')}
          >
            <Shield size={18} color={COLORS.primary} style={styles.privacyButtonIcon} />
            <Text style={styles.linkText}>View Privacy Policy</Text>
          </TouchableOpacity>
        </View>

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
