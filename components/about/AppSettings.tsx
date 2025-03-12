import React from 'react';
import { View, Text, Switch, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { AlertTriangle, Moon, Sun, Bell, BellOff } from 'lucide-react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';
import { isBrowserNotificationSupported } from '@/services/webNotificationService';
import { enableAudioPlayback } from '@/services/soundService';
import AlertTypeSettings from './AlertTypeSettings';

const isWeb = Platform.OS === 'web';

type AppSettingsProps = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  notificationsEnabled: boolean;
  webNotificationPermission: string | null;
  handleToggleNotifications: (value: boolean) => Promise<void>;
  handleRequestWebPermission: () => Promise<void>;
}

const AppSettings = ({
  isDarkMode,
  toggleTheme,
  notificationsEnabled,
  webNotificationPermission,
  handleToggleNotifications,
  handleRequestWebPermission
}: AppSettingsProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  // New custom styles for card-based layout
  const localStyles = StyleSheet.create({
    sectionHeader: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: colors.text.primary,
    },
    settingsCard: {
      backgroundColor: isDarkMode ? colors.card : colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.cardShadow,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activeCardIcon: {
      backgroundColor: isDarkMode ? colors.primaryDark : colors.primaryLight,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
    },
    cardContent: {
      marginBottom: 16,
    },
    description: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 4,
      lineHeight: 20,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    switchLabel: {
      fontSize: 14,
      marginRight: 8,
      color: colors.text.secondary,
    },
    infoNote: {
      fontSize: 13,
      color: colors.text.secondary,
      fontStyle: 'italic',
      marginTop: 8,
    },
    button: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 6,
    },
    warningCard: {
      backgroundColor: isDarkMode ? 'rgba(230, 126, 34, 0.1)' : '#FFF3E0',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    warningText: {
      flex: 1,
      color: isDarkMode ? colors.warning : '#e67e22',
      fontSize: 14,
      lineHeight: 20,
      marginLeft: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    enabledBadge: {
      backgroundColor: isDarkMode ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.1)',
    },
    disabledBadge: {
      backgroundColor: isDarkMode ? 'rgba(231, 76, 60, 0.2)' : 'rgba(231, 76, 60, 0.1)',
    },
    enabledText: {
      color: colors.success,
    },
    disabledText: {
      color: colors.error,
    },
  });

  const renderStatusBadge = (isEnabled: boolean, enabledText = 'Enabled', disabledText = 'Disabled') => (
    <View style={[
      localStyles.statusBadge,
      isEnabled ? localStyles.enabledBadge : localStyles.disabledBadge
    ]}>
      <Text style={[
        localStyles.statusText,
        isEnabled ? localStyles.enabledText : localStyles.disabledText
      ]}>
        {isEnabled ? enabledText : disabledText}
      </Text>
    </View>
  );
  
  // Enable audio on web when notifications are toggled on
  const onToggleNotifications = async (value: boolean) => {
    // If enabling notifications and on web, ensure audio is enabled
    if (value && isWeb) {
      enableAudioPlayback();
    }
    
    // Call the parent handler
    await handleToggleNotifications(value);
  };
  
  return (
    <View style={[styles.section, { padding: 20, backgroundColor: colors.surface }]}>
      <Text style={localStyles.sectionHeader}>App Settings</Text>
      
      {/* Theme Card */}
      <View style={localStyles.settingsCard}>
        <View style={localStyles.cardHeader}>
          <View style={[localStyles.cardIcon, isDarkMode && localStyles.activeCardIcon]}>
            {isDarkMode ? (
              <Moon size={20} color={isDarkMode ? colors.white : colors.text.primary} />
            ) : (
              <Sun size={20} color={isDarkMode ? colors.white : colors.text.primary} />
            )}
          </View>
          <Text style={localStyles.cardTitle}>Display Theme</Text>
          {renderStatusBadge(isDarkMode, "Dark", "Light")}
        </View>
        
        <View style={localStyles.cardContent}>
          <Text style={localStyles.description}>
            Choose between light and dark theme for the application interface.
            {isDarkMode 
              ? ' Dark theme helps reduce eye strain in low-light environments.' 
              : ' Light theme provides better visibility in bright environments.'}
          </Text>
        </View>
        
        <View style={localStyles.cardFooter}>
          <View style={localStyles.switchContainer}>
            <Text style={localStyles.switchLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d3d3d3', true: `${colors.primary}88` }}
              thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
      
      {/* Notifications Card */}
      <View style={localStyles.settingsCard}>
        <View style={localStyles.cardHeader}>
          <View style={[localStyles.cardIcon, notificationsEnabled && localStyles.activeCardIcon]}>
            {notificationsEnabled ? (
              <Bell size={20} color={notificationsEnabled && isDarkMode ? colors.white : colors.text.primary} />
            ) : (
              <BellOff size={20} color={notificationsEnabled && isDarkMode ? colors.white : colors.text.secondary} />
            )}
          </View>
          <Text style={localStyles.cardTitle}>
            {isWeb ? 'Web Notifications' : 'Background Notifications'}
          </Text>
          {renderStatusBadge(notificationsEnabled)}
        </View>
        
        <View style={localStyles.cardContent}>
          <Text style={localStyles.description}>
            {isWeb
              ? "Receive notifications about severe weather alerts while the website is open in your browser."
              : "Receive notifications about severe weather alerts even when the app is running in the background."}
          </Text>
          
          {isWeb && (
            <Text style={localStyles.infoNote}>
              Note: Web notifications only work when this tab is open
            </Text>
          )}
          
          {/* Permission request button for web */}
          {isWeb && isBrowserNotificationSupported() && webNotificationPermission !== 'granted' && (
            <TouchableOpacity 
              style={[localStyles.button, { marginTop: 12 }]} 
              onPress={handleRequestWebPermission}
            >
              <Bell size={16} color={colors.white} />
              <Text style={localStyles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={localStyles.cardFooter}>
          <View style={localStyles.switchContainer}>
            <Text style={localStyles.switchLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ false: '#d3d3d3', true: `${colors.primary}88` }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
      
      {/* Add the Alert Type Settings Card when notifications are enabled */}
      {notificationsEnabled && <AlertTypeSettings isDarkMode={isDarkMode} />}
      
      {/* Warning message if notifications disabled */}
      {!notificationsEnabled && (
        <View style={localStyles.warningCard}>
          <AlertTriangle size={18} color={colors.warning} />
          <Text style={localStyles.warningText}>
            {isWeb
              ? "Web notifications are disabled. You won't be notified of new weather alerts."
              : 'Background notifications are disabled. You may miss important weather alerts.'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default AppSettings;
