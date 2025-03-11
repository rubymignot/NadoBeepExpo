import { View, ScrollView, Platform, Linking, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import { useAlerts } from '@/context/AlertsContext';
import { playAlarmSound, stopAlarmSound, enableAudioPlayback, isAudioEnabled, subscribeToAudioState } from '@/services/soundService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAlertsNow, isForegroundServiceRunning, startForegroundService, stopForegroundService } from '@/services/foregroundService';
import { version as appVersion } from '../../package.json';
import { showAlertNotification } from '@/services/notifeeService';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  isBrowserNotificationSupported
} from '@/services/webNotificationService';
import { useTheme } from '@/context/ThemeContext';
import { createThemedStyles } from '@/styles/about.styles';

// Import all components
import {
  AppHeader,
  SafetyNotice,
  AppSettings,
  BatteryOptimization,
  ServiceDiagnostics,
  AboutSection,
  HowItWorks,
  AlertTypes,
  TestFunctions,
  DataSourceSection,
  PrivacySection,
  Footer
} from '@/components/about';

// Updated component for government disclaimer with better theme support
const GovDisclaimer = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  
  return (
    <View style={[
      styles.section, 
      { 
        backgroundColor: isDarkMode ? 'rgba(70, 70, 70, 0.5)' : 'rgba(245, 245, 245, 0.9)',
        marginVertical: 20,
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: colors.text.secondary,
      }
    ]}>
      <Text style={[
        styles.sectionTitle,
        { 
          color: colors.text.primary, 
          fontWeight: 'bold',
          fontSize: 15,
          marginBottom: 5 
        }
      ]}>
        INDEPENDENT APPLICATION NOTICE
      </Text>
      <Text style={[
        styles.paragraph,
        { 
          color: colors.text.secondary,
          fontSize: 14,
          lineHeight: 20
        }
      ]}>
        NadoBeep is not affiliated with, endorsed by, or an official product of any government agency. 
        This app relays public data from official sources but is independently developed.
      </Text>
    </View>
  );
};

const VERSION = appVersion;
const isWeb = Platform.OS === 'web';

export default function AboutScreen() {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const styles = createThemedStyles(colors);
  const [testingSound, setTestingSound] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isRestartingService, setIsRestartingService] = useState(false);
  const [canModifyBattery, setCanModifyBattery] = useState(false);
  const [manufacturerInfo, setManufacturerInfo] = useState<{
    hasSpecialRequirements: boolean;
    manufacturer: string | null;
    instructions: string;
  } | null>(null);
  const [webNotificationPermission, setWebNotificationPermission] = useState<string | null>(null);
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
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
    if (isWeb && isBrowserNotificationSupported()) {
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
  
  // Update web notification permission when notifications are enabled/disabled
  useEffect(() => {
    if (isWeb && isBrowserNotificationSupported()) {
      getNotificationPermission().then(permission => {
        setWebNotificationPermission(permission);
      });
    }
  }, [notificationsEnabled]);
  
  // Check if audio has been enabled previously
  useEffect(() => {
    if (isWeb) {
      setAudioEnabled(isAudioEnabled());
    }
  }, []);

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

  const handleToggleNotifications = async () => {
    await toggleNotifications();
  };
  
  const handleToggleSound = async () => {
    await toggleSound();
  };
  
  // Request web notification permission
  const handleRequestWebPermission = async () => {
    if (isWeb && isBrowserNotificationSupported()) {
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
      
      // Enable audio playback first (especially important for web)
      if (isWeb) {
        enableAudioPlayback();
        setAudioEnabled(true);
      }
      
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
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader version={VERSION} isDarkMode={isDarkMode} />
        
        <SafetyNotice isDarkMode={isDarkMode} />
        
        <AppSettings
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          notificationsEnabled={notificationsEnabled}
          isSoundEnabled={isSoundEnabled}
          webNotificationPermission={webNotificationPermission}
          handleToggleNotifications={handleToggleNotifications}
          handleToggleSound={handleToggleSound}
          handleRequestWebPermission={handleRequestWebPermission}
        />
        
        {Platform.OS === 'android' && canModifyBattery && (
          <BatteryOptimization
            isDarkMode={isDarkMode}
            manufacturerInfo={manufacturerInfo}
            handleOpenBatterySettings={handleOpenBatterySettings}
          />
        )}
        
        {Platform.OS === 'android' && (
          <ServiceDiagnostics
            isDarkMode={isDarkMode}
            serviceStatus={serviceStatus}
            isLoadingStatus={isLoadingStatus}
            isRestartingService={isRestartingService}
            isCheckingAlerts={isCheckingAlerts}
            fetchServiceStatus={fetchServiceStatus}
            handleServiceRestart={handleServiceRestart}
            handleCheckAlertsNow={handleCheckAlertsNow}
          />
        )}
        
        <AboutSection isDarkMode={isDarkMode} />
        
        <HowItWorks isDarkMode={isDarkMode} />
        
        <AlertTypes isDarkMode={isDarkMode} />
        
        <TestFunctions
          isDarkMode={isDarkMode}
          testingSound={testingSound}
          testTornadoWarning={testTornadoWarning}
        />
        
        <DataSourceSection isDarkMode={isDarkMode} />
        
        <PrivacySection isDarkMode={isDarkMode} />
        
        <GovDisclaimer isDarkMode={isDarkMode} />
        
        <Footer isDarkMode={isDarkMode} />
      </ScrollView>
    </SafeAreaView>
  );
}
