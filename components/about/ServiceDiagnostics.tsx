import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, AlertTriangle } from 'lucide-react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type ServiceDiagnosticsProps = {
  isDarkMode: boolean;
  serviceStatus: any;
  isLoadingStatus: boolean;
  isRestartingService: boolean;
  isCheckingAlerts: boolean;
  fetchServiceStatus: () => Promise<void>;
  handleServiceRestart: () => Promise<void>;
  handleCheckAlertsNow: () => Promise<void>;
}

const ServiceDiagnostics = ({
  isDarkMode,
  serviceStatus,
  isLoadingStatus,
  isRestartingService,
  isCheckingAlerts,
  fetchServiceStatus,
  handleServiceRestart,
  handleCheckAlertsNow
}: ServiceDiagnosticsProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Background Service Diagnostics</Text>
      
      {isLoadingStatus ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading status...</Text>
        </View>
      ) : serviceStatus ? (
        <View style={styles.statusDetails}>
          <View style={[
            styles.statusCard, 
            { 
              backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.5)' : '#f8f9fa',
              borderLeftColor: colors.secondary
            }
          ]}>
            <Text style={[styles.statusCardTitle, { color: colors.secondary }]}>Service Status</Text>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Notifications: </Text>
              <Text style={[
                styles.statusValue, 
                {color: serviceStatus.notificationsEnabled ? '#2ecc71' : '#e74c3c'}
              ]}>
                {serviceStatus.notificationsEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Service Active: </Text>
              <Text style={[
                styles.statusValue, 
                {color: serviceStatus.taskRegistered ? '#2ecc71' : '#e74c3c'}
              ]}>
                {serviceStatus.taskRegistered ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.statusCard, 
            { 
              backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.5)' : '#f8f9fa',
              borderLeftColor: colors.secondary
            }
          ]}>
            <Text style={[styles.statusCardTitle, { color: colors.secondary }]}>API Activity</Text>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Last Check Status: </Text>
              <Text style={[styles.statusValue, { color: colors.text.secondary }]}>
                {serviceStatus.fetchStatus || 'Unknown'}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.text.primary }]}>API Errors: </Text>
              <Text style={[
                styles.statusValue,
                {color: serviceStatus.errorCount > 0 ? '#e74c3c' : '#2ecc71'}
              ]}>
                {serviceStatus.errorCount || 0}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Notifications Sent: </Text>
              <Text style={[styles.statusValue, { color: colors.text.secondary }]}>
                {serviceStatus.notificationCount || 0}
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.statusCard, 
            { 
              backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.5)' : '#f8f9fa',
              borderLeftColor: colors.secondary
            }
          ]}>
            <Text style={[styles.statusCardTitle, { color: colors.secondary }]}>Timestamps</Text>
            {serviceStatus.serviceStartTime && (
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Service Started: </Text>
                <Text style={[styles.statusValue, { color: colors.text.secondary }]}>
                  {new Date(serviceStatus.serviceStartTime).toLocaleString()}
                </Text>
              </View>
            )}
            
            {serviceStatus.lastUpdateTime && (
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Last Check: </Text>
                <Text style={[styles.statusValue, { color: colors.text.secondary }]}>
                  {new Date(serviceStatus.lastUpdateTime).toLocaleString()}
                </Text>
              </View>
            )}
            
            {serviceStatus.lastSuccessfulFetch && (
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Last Successful: </Text>
                <Text style={[styles.statusValue, { color: colors.text.secondary }]}>
                  {new Date(serviceStatus.lastSuccessfulFetch).toLocaleString()}
                </Text>
              </View>
            )}
            
            {serviceStatus.lastForegroundServiceRun && (
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Service Run: </Text>
                <Text style={[styles.statusValue, { color: colors.text.secondary }]}>
                  {new Date(parseInt(serviceStatus.lastForegroundServiceRun)).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text.primary }]}>Device: </Text>
            <Text style={[styles.statusValue, { color: colors.text.secondary }]}>
              {serviceStatus.deviceType} ({serviceStatus.platform} {serviceStatus.osVersion})
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.paragraph}>Status information not available.</Text>
      )}
      
      <View style={styles.serviceControls}>
        <TouchableOpacity 
          style={[styles.serviceButton, { backgroundColor: colors.secondary }]}
          onPress={fetchServiceStatus}
          disabled={isLoadingStatus}
        >
          <RefreshCw size={16} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.serviceButtonText}>Refresh Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.serviceButton, styles.checkButton, { backgroundColor: colors.success }]} 
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
          style={[
            styles.serviceButton, 
            styles.restartButton, 
            { 
              flex: 1,
              backgroundColor: colors.warning
            }
          ]} 
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
      
      <Text style={[styles.serviceNote, { color: colors.text.secondary }]}>
        If you're not receiving notifications when the app is in the background, 
        try restarting the background service.
      </Text>
    </View>
  );
};

export default ServiceDiagnostics;
