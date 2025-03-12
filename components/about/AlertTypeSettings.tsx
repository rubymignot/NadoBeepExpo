import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, Platform } from 'react-native';
import { Bell, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Volume2, VolumeX } from 'lucide-react-native';
import { useAlerts } from '@/context/AlertsContext';
import { FILTERED_ALERT_TYPES, EVENT_COLORS } from '@/constants/alerts';
import { LIGHT_COLORS, DARK_COLORS, BREAKPOINTS } from '@/constants/theme';

type AlertTypeSettingsProps = {
  isDarkMode: boolean;
};

const AlertTypeSettings = ({ isDarkMode }: AlertTypeSettingsProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const [expanded, setExpanded] = useState(false);
  const { 
    state, 
    toggleAlertType, 
    isAlertTypeEnabled, 
    toggleAllAlertTypes,
    toggleAlarmForAlertType, 
    isAlarmEnabledForAlertType, 
    toggleAlarmForAllAlertTypes,
    setSoundVolume 
  } = useAlerts();
  
  const { enabledAlertTypes, alarmEnabledAlertTypes } = state;
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [numColumns, setNumColumns] = useState(1);
  
  // Filter out "Test Tornado Warning" from the notification types
  const filteredAlertTypes = useMemo(() => {
    return FILTERED_ALERT_TYPES.filter(alertType => alertType !== "Test Tornado Warning");
  }, []);
  
  // Count how many notification types are enabled, excluding test warnings
  const enabledCount = useMemo(() => {
    return enabledAlertTypes.filter(type => type !== "Test Tornado Warning").length;
  }, [enabledAlertTypes]);
  
  // Count how many alarm types are enabled, excluding test warnings
  const alarmEnabledCount = useMemo(() => {
    return alarmEnabledAlertTypes.filter(type => type !== "Test Tornado Warning").length;
  }, [alarmEnabledAlertTypes]);
  
  const totalAlertTypes = filteredAlertTypes.length;

  // Update column count based on screen width
  useEffect(() => {
    const updateLayout = () => {
      const width = Dimensions.get('window').width;
      setScreenWidth(width);
      
      // Determine number of columns based on screen width
      if (width >= BREAKPOINTS.desktop) {
        setNumColumns(3); // Desktop: 3 columns
      } else if (width >= BREAKPOINTS.tablet) {
        setNumColumns(2); // Tablet: 2 columns
      } else {
        setNumColumns(1); // Mobile: 1 column
      }
    };
    
    updateLayout(); // Initial setup
    
    // Add event listener for web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('resize', updateLayout);
      return () => window.removeEventListener('resize', updateLayout);
    }
  }, []);

  // Create separate mobile styles that won't affect web
  const mobileStyles = Platform.OS !== 'web' ? {
    alertCardMobile: {
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
      borderLeftWidth: 4,
      backgroundColor: isDarkMode ? 'rgba(30,30,30,0.9)' : '#ffffff',
      shadowOpacity: 0.15,
      elevation: 3,
      padding: 10,
      margin: 0,
      marginBottom: 10,
    },
    fullWidthContainer: {
      width: '100%' as const,
    },
    fullWidthTitle: {
      marginBottom: 12,
      width: '100%' as const,
    },
    fullWidthButtonContainer: {
      width: '100%' as const,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    actionButtonMobile: {
      flex: 1,
      marginHorizontal: 4,
    }
  } : null;

  const styles = StyleSheet.create({
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
      marginBottom: expanded ? 16 : 0,
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
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
    },
    description: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    // Grid container 
    listContainer: {
      width: '100%', 
      // Remove fixed height to let content determine height
      marginBottom: 16, // Add space after list
    },
    // Individual notification card
    alertCard: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : colors.white,
      borderRadius: 10,
      padding: numColumns === 1 ? 12 : 10, // Less padding on larger layouts
      margin: numColumns === 1 ? 0 : 6, // No side margins on mobile
      marginBottom: 12, // Add bottom margin to separate cards on mobile
      shadowColor: colors.cardShadow,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
      flex: 1, // Makes cards equal width in a row
    },
    alertTypeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    alertTypeIndicator: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginRight: 10,
    },
    alertTypeName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
    },
    togglesContainer: {
      flexDirection: numColumns === 1 ? 'row' : 'column', // Row on mobile, column on tablet/desktop
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8, 
    },
    toggleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: numColumns === 1 ? 'flex-start' : 'space-between', // Different layout on mobile
      width: numColumns === 1 ? 'auto' : '100%', // Full width only on tablet/desktop
    },
    toggleLabel: {
      fontSize: 13,
      color: colors.text.secondary,
      marginRight: 8,
      display: numColumns === 1 ? 'none' : 'flex', // Hide labels on mobile to save space
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: 8,
      minWidth: 80,
    },
    enabledButton: {
      backgroundColor: isDarkMode ? colors.primaryDark : colors.primaryLight,
    },
    disabledButton: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    buttonText: {
      fontSize: 12,
      marginLeft: 6,
      fontWeight: '500',
    },
    enabledButtonText: {
      color: colors.white,
    },
    disabledButtonText: {
      color: colors.text.secondary,
    },
    noItemsMessage: {
      textAlign: 'center',
      color: colors.text.secondary,
      fontStyle: 'italic',
      padding: 20,
    },
    bulkActionsContainer: {
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    bulkActionRow: {
      flexDirection: numColumns > 1 ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: numColumns > 1 ? 'center' : 'flex-start',
      marginBottom: 16,
    },
    bulkActionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: numColumns > 1 ? 0 : 8,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      marginHorizontal: 4,
      minWidth: 110,
    },
    enableAllButton: {
      backgroundColor: colors.success,
    },
    disableAllButton: {
      backgroundColor: colors.danger,
    },
    actionButtonText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 6,
    },
    warningNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 16,
      padding: 12,
      backgroundColor: isDarkMode ? 'rgba(230, 126, 34, 0.1)' : '#FFF3E0',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
    },
    warningText: {
      fontSize: 13,
      color: isDarkMode ? colors.warning : '#e67e22',
      flex: 1,
      marginLeft: 8,
    },
    countBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    countText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginLeft: 4,
      marginRight: 12,
    },
    expandIconContainer: {
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContentContainer: {
      paddingHorizontal: numColumns === 1 ? 0 : 6, // No horizontal padding on mobile
      paddingBottom: 8,
    },
    flatListContainer: {
      width: '100%',
      // Fix for Android scrolling
      flex: 1,
    }
  });

  const toggleExpansion = () => {
    setExpanded(!expanded);
  };

  // Render a single notification card
  const renderAlertCard = ({ item: alertType }: { item: string }) => {
    const isNotificationEnabled = isAlertTypeEnabled(alertType);
    const isAlarmEnabled = isAlarmEnabledForAlertType(alertType);
    const alertColor = EVENT_COLORS[alertType as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;

    return (
      <View style={[
        styles.alertCard, 
        // Apply mobile-specific styles conditionally without touching web
        Platform.OS !== 'web' ? mobileStyles?.alertCardMobile : { borderLeftWidth: 4, borderLeftColor: alertColor }
      ]}>
        {/* Notification type header */}
        <View style={styles.alertTypeHeader}>
          <View 
            style={[
              styles.alertTypeIndicator, 
              { backgroundColor: alertColor }
            ]} 
          />
          <Text style={styles.alertTypeName} numberOfLines={1}>{alertType}</Text>
        </View>
        
        {/* Toggle buttons container */}
        <View style={styles.togglesContainer}>
          {/* Notification toggle */}
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Notification:</Text>
            <TouchableOpacity 
              onPress={() => toggleAlertType(alertType)}
              style={[
                styles.toggleButton,
                isNotificationEnabled ? styles.enabledButton : styles.disabledButton
              ]}
            >
              <Bell size={14} color={isNotificationEnabled ? colors.white : colors.text.secondary} />
              <Text 
                style={[
                  styles.buttonText, 
                  isNotificationEnabled ? styles.enabledButtonText : styles.disabledButtonText
                ]}
              >
                {isNotificationEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Alarm sound toggle */}
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Sound:</Text>
            <TouchableOpacity 
              onPress={() => toggleAlarmForAlertType(alertType)}
              style={[
                styles.toggleButton,
                isAlarmEnabled ? styles.enabledButton : styles.disabledButton
              ]}
            >
              <Volume2 
                size={14} 
                color={
                  isAlarmEnabled 
                    ? colors.white
                    : colors.text.secondary
                } 
              />
              <Text 
                style={[
                  styles.buttonText,
                  isAlarmEnabled ? styles.enabledButtonText : styles.disabledButtonText
                ]}
              >
                {isAlarmEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  
  // Empty list placeholder
  const renderEmptyList = () => (
    <Text style={styles.noItemsMessage}>No notification types available</Text>
  );

  return (
    <View style={styles.settingsCard}>
      <TouchableOpacity activeOpacity={0.7} onPress={toggleExpansion}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Bell size={20} color={colors.text.primary} />
          </View>
          <Text style={styles.cardTitle}>Notification Settings</Text>
          
          {/* Count summary */}
          <View style={styles.countBadge}>
            <Bell size={14} color={colors.text.secondary} />
            <Text style={styles.countText}>{enabledCount}/{totalAlertTypes}</Text>
            <Volume2 size={14} color={colors.text.secondary} />
            <Text style={styles.countText}>{alarmEnabledCount}</Text>
          </View>
          
          <View style={styles.expandIconContainer}>
            {expanded ? (
              <ChevronUp size={18} color={colors.text.secondary} />
            ) : (
              <ChevronDown size={18} color={colors.text.secondary} />
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      {expanded && (
        <>
          <Text style={styles.description}>
            Choose which weather alerts you want to receive notifications for and which should play alarm sounds.
          </Text>
          
          {/* Notification types grid with FlatList - Fixed for mobile */}
          <View style={styles.listContainer}>
            <FlatList
              data={filteredAlertTypes}
              renderItem={renderAlertCard}
              keyExtractor={(item) => item}
              numColumns={numColumns}
              key={numColumns} // Force re-render when columns change
              contentContainerStyle={styles.listContentContainer}
              style={styles.flatListContainer}
              ListEmptyComponent={renderEmptyList}
              scrollEnabled={false} // Disable scrolling in FlatList
              removeClippedSubviews={Platform.OS !== 'web'} // Better performance on mobile
              initialNumToRender={20} // Render more items initially since we're not scrolling
              // Remove nestedScrollEnabled as it's not needed when scrollEnabled is false
            />
          </View>
          
          {/* Bulk actions section */}
          <View style={styles.bulkActionsContainer}>
            {/* Notification bulk actions */}
            <View style={[styles.bulkActionRow, Platform.OS !== 'web' && mobileStyles?.fullWidthContainer]}>
              <Text style={[styles.bulkActionTitle, Platform.OS !== 'web' && mobileStyles?.fullWidthTitle]}>Notification Settings</Text>
              <View style={[styles.actionButtonsContainer, Platform.OS !== 'web' && mobileStyles?.fullWidthButtonContainer]}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.enableAllButton, Platform.OS !== 'web' && mobileStyles?.actionButtonMobile]}
                  onPress={() => toggleAllAlertTypes(true)}
                >
                  <CheckCircle size={16} color={colors.white} />
                  <Text style={styles.actionButtonText}>Enable All</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.disableAllButton, Platform.OS !== 'web' && mobileStyles?.actionButtonMobile]}
                  onPress={() => toggleAllAlertTypes(false)}
                >
                  <VolumeX size={16} color={colors.white} />
                  <Text style={styles.actionButtonText}>Disable All</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Alarm bulk actions */}
            <View style={[styles.bulkActionRow, Platform.OS !== 'web' && mobileStyles?.fullWidthContainer]}>
              <Text style={[styles.bulkActionTitle, Platform.OS !== 'web' && mobileStyles?.fullWidthTitle]}>Sound Alert Settings</Text>
              <View style={[styles.actionButtonsContainer, Platform.OS !== 'web' && mobileStyles?.fullWidthButtonContainer]}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.enableAllButton, Platform.OS !== 'web' && mobileStyles?.actionButtonMobile]}
                  onPress={() => toggleAlarmForAllAlertTypes(true)}
                >
                  <Volume2 size={16} color={colors.white} />
                  <Text style={styles.actionButtonText}>Enable All</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.disableAllButton, Platform.OS !== 'web' && mobileStyles?.actionButtonMobile]}
                  onPress={() => toggleAlarmForAllAlertTypes(false)}
                >
                  <VolumeX size={16} color={colors.white} />
                  <Text style={styles.actionButtonText}>Disable All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Warning when all notifications are disabled */}
          {enabledCount === 0 && (
            <View style={styles.warningNote}>
              <AlertTriangle size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                You won't receive any notification notifications if all types are disabled.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default AlertTypeSettings;
