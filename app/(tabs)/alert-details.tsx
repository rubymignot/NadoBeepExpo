import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
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
          'User-Agent': '(NadoBeep, contact@nadobeep.com)',
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

  // Generate NWS link for the specific alert
  const getNWSLink = (id: string) => {
    return `https://alerts.weather.gov/cap/wwacapget.php?x=${id}`;
  };

  // ... rest of the component remains unchanged
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading alert details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertTriangle size={50} color="#e74c3c" />
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
          colors={['#e74c3c']}
          tintColor="#e74c3c"
        />
      }
    >
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#e74c3c" />
        <Text style={styles.backButtonText}>Back to Alerts</Text>
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
        <Text style={styles.headline}>{alert.properties.headline}</Text>
        <Text style={styles.areaDesc}>{alert.properties.areaDesc}</Text>

        <View style={styles.timeSection}>
          <Text style={styles.timeLabel}>Issued:</Text>
          <Text style={styles.timeValue}>{formatDate(alert.properties.sent)}</Text>
          <Text style={styles.timeLabel}>Expires:</Text>
          <Text style={styles.timeValue}>{formatDate(alert.properties.expires)}</Text>
        </View>

        {alert.properties.instruction && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.sectionText}>{alert.properties.instruction}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>{alert.properties.description}</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Additional Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{alert.properties.status}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Urgency:</Text>
            <Text style={styles.detailValue}>{alert.properties.urgency}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Certainty:</Text>
            <Text style={styles.detailValue}>{alert.properties.certainty}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{alert.properties.category}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.nwsLink}
          onPress={() => Linking.openURL(getNWSLink(alert.properties.id))}
        >
          <Text style={styles.nwsLinkText}>View on National Weather Service</Text>
          <ExternalLink size={16} color="#3498db" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 8,
  },
  content: {
    padding: 16,
  },
  eventType: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  headline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  areaDesc: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  timeSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  timeValue: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  sectionText: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  detailsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: 'Inter-Medium',
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: '#2c3e50',
    fontFamily: 'Inter-Regular',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#e74c3c',
    fontFamily: 'Inter-Medium',
  },
  nwsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 30,
  },
  nwsLinkText: {
    fontSize: 16,
    color: '#3498db',
    marginRight: 8,
    fontFamily: 'Inter-Medium',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    marginTop: 10,
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});