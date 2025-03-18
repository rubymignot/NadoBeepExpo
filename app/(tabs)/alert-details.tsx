import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  Linking,
  ImageBackground
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  HelpCircle, 
  ExternalLink, 
  ShieldAlert, 
  MapIcon,
  Wind,
  CloudRain,
  CloudSnow,
  CloudFog,
  Droplets,
  Zap
} from 'lucide-react-native';

import { EVENT_COLORS, SEVERITY_COLORS } from '@/constants/alerts';
import { getRelativeTime } from '@/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { FONTS } from '@/constants/theme';

const { width: windowWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// For now, just use a simple pattern background (replace later with actual pattern images)
const DEFAULT_PATTERN = { uri: 'https://www.transparenttextures.com/patterns/light-paper-fibers.png' };

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

  // Get the right icon based on the event type
  const getEventIcon = (event: string) => {
    const eventLower = event.toLowerCase();
    const size = 60;
    const color = "#FFFFFF";
    const strokeWidth = 1.5;

    if (eventLower.includes('tornado')) {
      return <Wind size={size} color={color} strokeWidth={strokeWidth} />;
    } else if (eventLower.includes('flood')) {
      return <Droplets size={size} color={color} strokeWidth={strokeWidth} />;
    } else if (eventLower.includes('thunderstorm')) {
      return <Zap size={size} color={color} strokeWidth={strokeWidth} />;
    } else if (eventLower.includes('rain')) {
      return <CloudRain size={size} color={color} strokeWidth={strokeWidth} />;
    } else if (eventLower.includes('snow') || eventLower.includes('winter')) {
      return <CloudSnow size={size} color={color} strokeWidth={strokeWidth} />;
    } else if (eventLower.includes('dust') || eventLower.includes('fog')) {
      return <CloudFog size={size} color={color} strokeWidth={strokeWidth} />;
    } else if (eventLower.includes('wind') || eventLower.includes('marine')) {
      return <Wind size={size} color={color} strokeWidth={strokeWidth} />;
    }

    return <AlertTriangle size={size} color={color} strokeWidth={strokeWidth} />;
  };

  // Mark an alert as seen 
  const markAlertSeen = async (alertId: string) => {
    try {
      const seenAlertsString = await AsyncStorage.getItem('seenAlerts');
      const seenAlerts = seenAlertsString ? seenAlertsString.split('|') : [];
      
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

  const fetchAlertDetails = useCallback(async () => {
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
  }, [alertId]);

  useEffect(() => {
    fetchAlertDetails();
  }, [fetchAlertDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlertDetails();
  };

  // Format date with absolute and relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const absoluteTime = date.toLocaleString();
    const relativeTime = getRelativeTime(date);
    return { absoluteTime, relativeTime };
  };

  const getEventColor = (event: string) => {
    return EVENT_COLORS[event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
  };

  const getSeverityColor = (severity: string) => {
    return SEVERITY_COLORS[severity.toLowerCase() as keyof typeof SEVERITY_COLORS] || 
      SEVERITY_COLORS.unknown;
  };
  
  // Navigate to map view
  const handleViewMap = () => {
    if (alert) {
      router.push({
        pathname: '/map',
        params: { alert: alert.properties.id, zoom: 'true' }
      });
    }
  };

  const bgColor = isDarkMode ? '#121212' : '#f8f9fa';
  const cardBgColor = isDarkMode ? '#1e1e1e' : '#ffffff';
  const textColor = isDarkMode ? '#f0f0f0' : '#212529';
  const secondaryTextColor = isDarkMode ? '#a0a0a0' : '#6c757d';

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading alert details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />
        <View style={styles.errorContainer}>
          <AlertTriangle size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Error Loading Alert</Text>
          <Text style={[styles.errorMessage, { color: secondaryTextColor }]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAlertDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />
        <View style={styles.errorContainer}>
          <Info size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Alert Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const eventColor = getEventColor(alert.properties.event);
  const severityColor = getSeverityColor(alert.properties.severity);
  const sentDate = formatDate(alert.properties.sent);
  const expiresDate = formatDate(alert.properties.expires);
  const eventIcon = getEventIcon(alert.properties.event);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[eventColor]}
            tintColor={eventColor}
          />
        }
      >
        {/* Header with subtle design */}
        <View style={[styles.headerContainer, { backgroundColor: bgColor }]}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={[styles.eventIconContainer, { borderColor: eventColor, borderWidth: 2 }]}>
              {eventIcon}
            </View>
            <Text style={[styles.eventType, { color: colors.text.primary }]}>
              {alert.properties.event}
            </Text>
            <View style={[styles.severityBadge, { 
              backgroundColor: 'transparent',
              borderColor: severityColor,
              borderWidth: 1
            }]}>
              <Text style={[styles.severityText, { color: severityColor }]}>
                {alert.properties.severity}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Main Content Area */}
          <View style={[styles.contentCard, { backgroundColor: cardBgColor }]}>
            <View style={styles.titleSection}>
              <View style={[styles.colorAccent, { backgroundColor: eventColor }]} />
              <Text style={[styles.headline, { color: textColor }]}>
                {alert.properties.headline}
              </Text>
            </View>

            <View style={styles.locationContainer}>
              <MapPin size={20} color={colors.text.secondary} style={styles.locationIcon} />
              <Text style={[styles.locationText, { color: textColor }]}>
                {alert.properties.areaDesc}
              </Text>
            </View>

            {/* Timing Information */}
            <View style={styles.timeSection}>
              <View style={styles.timeRow}>
                <View style={styles.timeIconContainer}>
                  <Calendar size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.timeTextContainer}>
                  <Text style={[styles.timeLabel, { color: secondaryTextColor }]}>
                    Issued:
                  </Text>
                  <Text style={[styles.timeValue, { color: textColor }]}>
                    {sentDate.absoluteTime}
                  </Text>
                  <Text style={[styles.timeRelative, { color: secondaryTextColor }]}>
                    {sentDate.relativeTime}
                  </Text>
                </View>
              </View>

              <View style={[styles.timeRow, styles.expireRow]}>
                <View style={styles.timeIconContainer}>
                  <Clock size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.timeTextContainer}>
                  <Text style={[styles.timeLabel, { color: secondaryTextColor }]}>
                    Expires:
                  </Text>
                  <Text style={[styles.timeValue, { color: textColor }]}>
                    {expiresDate.absoluteTime}
                  </Text>
                  <Text style={[styles.timeRelative, { color: secondaryTextColor }]}>
                    {expiresDate.relativeTime}
                  </Text>
                </View>
              </View>
            </View>

            {/* Buttons for Map and Source */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.mapButton, { 
                  backgroundColor: '#f5f5f5', 
                  borderColor: eventColor,
                  borderWidth: 1
                }]} 
                onPress={handleViewMap}
              >
                <MapIcon size={20} color={eventColor} />
                <Text style={[styles.mapButtonText, { color: eventColor }]}>View on Map</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sourceButton, { borderColor: '#ddd' }]} 
                onPress={() => Linking.openURL(`https://api.weather.gov/alerts/${alertId}`)}
              >
                <ExternalLink size={20} color={colors.text.secondary} />
                <Text style={[styles.sourceButtonText, { color: colors.text.secondary }]}>NWS Source</Text>
              </TouchableOpacity>
            </View>

            {/* Alert Instructions */}
            {alert.properties.instruction && (
              <View style={styles.instructionSection}>
                <View style={styles.sectionHeader}>
                  <ShieldAlert size={20} color={colors.text.secondary} />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    Instructions
                  </Text>
                </View>
                <View style={[styles.contentBox, { borderLeftColor: eventColor }]}>
                  <Text style={[styles.instructionText, { color: textColor }]}>
                    {alert.properties.instruction}
                  </Text>
                </View>
              </View>
            )}

            {/* Alert Description */}
            <View style={styles.descriptionSection}>
              <View style={styles.sectionHeader}>
                <Info size={20} color={colors.text.secondary} />
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Description
                </Text>
              </View>
              <View style={[styles.contentBox, { borderLeftColor: eventColor }]}>
                <Text style={[styles.descriptionText, { color: textColor }]}>
                  {alert.properties.description}
                </Text>
              </View>
            </View>

            {/* Additional Details */}
            <View style={styles.detailsSection}>
              <View style={styles.sectionHeader}>
                <HelpCircle size={20} color={colors.text.secondary} />
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Additional Details
                </Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Status:</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {alert?.properties?.status}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Urgency:</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {alert?.properties?.urgency}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Certainty:</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {alert?.properties?.certainty}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Category:</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {alert?.properties?.category}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Government Disclaimer */}
            <View style={[styles.disclaimerSection, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f1f1f1' }]}>
              <Text style={[styles.disclaimerText, { color: secondaryTextColor }]}>
                Data provided by the National Weather Service. This app is not affiliated with nor endorsed by any government agency.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#dc3545',
    fontFamily: FONTS.bold,
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
    fontFamily: FONTS.regular,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  // New header styles to replace hero header
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 60,
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 40 : 20,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  eventType: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  severityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  severityText: {
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  contentContainer: {
    padding: 16,
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  contentCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  colorAccent: {
    width: 4,
    marginRight: 12,
    borderRadius: 4,
  },
  headline: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  locationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  timeSection: {
    marginBottom: 24,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  expireRow: {
    marginBottom: 0,
  },
  timeIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: FONTS.medium,
  },
  timeValue: {
    fontSize: 16,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  timeRelative: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    marginTop: 24,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: FONTS.semiBold,
  },
  sourceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  sourceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: FONTS.semiBold,
  },
  instructionSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: FONTS.semiBold,
  },
  contentBox: {
    borderLeftWidth: 2,
    paddingLeft: 14,
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsGrid: {
    flexDirection: 'column',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 100,
    fontFamily: FONTS.medium,
    fontSize: 15,
  },
  detailValue: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
  },
  disclaimerSection: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
});