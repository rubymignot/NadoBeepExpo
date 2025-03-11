import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
  Platform,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react-native';
import { EVENT_COLORS, SEVERITY_COLORS } from '@/constants/alerts';
import { getRelativeTime } from '@/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createThemedStyles } from '@/styles/alerts-screen.styles';
import { useTheme } from '@/context/ThemeContext';

interface AlertProperties {
  id: string;
  areaDesc: string;
  headline: string;
  severity: string;
  urgency: string;
  event: string;
  sent: string;
  effective: string;
  expires: string;
  status: string;
  messageType: string;
  category: string;
  certainty: string;
  instruction: string | null;
  description: string;
}

interface Alert {
  properties: AlertProperties;
}

export default function AlertDetailsScreen() {
  const { alertId } = useLocalSearchParams();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { isDarkMode, colors } = useTheme();
  const styles = createThemedStyles(colors);

  // Mark an alert as seen (since the useAlerts context doesn't expose this functionality)
  const markAlertSeen = async (alertId: string) => {
    try {
      // Get current seen alerts
      const seenAlertsString = await AsyncStorage.getItem('seenAlerts');
      const seenAlerts = seenAlertsString ? seenAlertsString.split('|') : [];
      
      // Add this alert if not already there
      if (!seenAlerts.includes(alertId)) {
        seenAlerts.push(alertId);
        await AsyncStorage.setItem('seenAlerts', seenAlerts.join('|'));
      }
      
      return true;
    } catch (error) {
      console.error('Error marking alert as seen:', error);
      return false;
    }
  };

  const fetchAlertDetails = async () => {
    try {
      setError(null);
      const response = await fetch(`https://api.weather.gov/alerts/${alertId}`, {
        headers: {
          'User-Agent': '(NadoBeep App)',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      setAlert(data);
      
      // Mark this alert as seen
      if (data && data.properties && data.properties.id) {
        await markAlertSeen(data.properties.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alert details');
      console.error('Failed to fetch alert details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlertDetails();
  }, [alertId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlertDetails();
  };

  // Format date with absolute and relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const absoluteTime = date.toLocaleString();
    const relativeTime = getRelativeTime(date);
    return `${absoluteTime} (${relativeTime})`;
  };

  const getSeverityColor = (severity: string) => {
    return SEVERITY_COLORS[severity.toLowerCase() as keyof typeof SEVERITY_COLORS] || 
      SEVERITY_COLORS.unknown;
  };

  const getEventColor = (event: string) => {
    return EVENT_COLORS[event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading alert details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertTriangle size={50} color={colors.primary} />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAlertDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!alert) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Alert not found</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <TouchableOpacity 
        style={[
          styles.backButton,
          Platform.OS === 'android' ? { marginTop: 16, paddingTop: 16 } : {}
        ]} 
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={colors.primary} />
        <Text style={[styles.backButtonText, {color: colors.primary}]}>Back</Text>
      </TouchableOpacity>

      <View style={[
        styles.header,
        { borderLeftColor: getEventColor(alert.properties.event) }
      ]}>
        <Text style={[
          styles.eventType,
          { color: getEventColor(alert.properties.event) }
        ]}>
          {alert.properties.event}
        </Text>
        <Text style={[
          styles.severityBadge,
          { backgroundColor: getSeverityColor(alert.properties.severity) }
        ]}>
          {alert.properties.severity}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.headline, { color: colors.text.primary }]}>
          {alert.properties.headline}
        </Text>
        <Text style={[styles.areaDesc, { color: colors.text.primary }]}>
          {alert.properties.areaDesc}
        </Text>

        <View style={[styles.timeSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.timeLabel, { color: colors.text.secondary }]}>Issued:</Text>
          <Text style={[styles.timeValue, { color: colors.text.primary }]}>
            {formatDate(alert.properties.sent)}
          </Text>
          <Text style={[styles.timeLabel, { color: colors.text.secondary }]}>Expires:</Text>
          <Text style={[styles.timeValue, { color: colors.text.primary }]}>
            {formatDate(alert.properties.expires)}
          </Text>
        </View>

        {alert.properties.instruction && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Instructions</Text>
            <Text style={[styles.sectionText, { color: colors.text.primary }]}>
              {alert.properties.instruction}
            </Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Description</Text>
          <Text style={[styles.sectionText, { color: colors.text.primary }]}>
            {alert.properties.description}
          </Text>
        </View>

        <View style={[styles.detailsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.detailsTitle, { color: colors.text.primary }]}>Additional Details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Status:</Text>
            <Text style={[styles.detailValue, { color: colors.text.primary }]}>
              {alert.properties.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Urgency:</Text>
            <Text style={[styles.detailValue, { color: colors.text.primary }]}>
              {alert.properties.urgency}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Certainty:</Text>
            <Text style={[styles.detailValue, { color: colors.text.primary }]}>
              {alert.properties.certainty}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Category:</Text>
            <Text style={[styles.detailValue, { color: colors.text.primary }]}>
              {alert.properties.category}
            </Text>
          </View>
        </View>
                {/* Government disclaimer with improved theme styling */}
                <View style={{
          backgroundColor: isDarkMode ? 'rgba(70, 70, 70, 0.5)' : 'rgba(245, 245, 245, 0.9)',
          padding: 12,
          marginTop: 20,
          marginBottom: 10,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: colors.text.secondary,
        }}>
          <Text style={{
            color: colors.text.primary,
            fontWeight: '600',
            fontSize: 14,
            marginBottom: 4,
          }}>
            INDEPENDENT APPLICATION NOTICE
          </Text>
          <Text style={{
            color: colors.text.secondary,
            fontSize: 13,
            lineHeight: 18,
          }}>
            NadoBeep displays data from official sources but is not affiliated with any government agency.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}