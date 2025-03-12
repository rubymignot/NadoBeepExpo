import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  Wind,
  Droplets,
  Zap,
  CloudRain,
  CloudSnow,
  CloudFog,
} from 'lucide-react-native';
import { Alert, AlertSeverity } from '@/types/alerts';
import { EVENT_COLORS, SEVERITY_COLORS } from '@/constants/alerts';
import { getRelativeTime } from '@/utils/dateUtils';
import { FONTS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  alert: Alert;
  onPress: (alert: Alert) => void;
}

export const AlertItem: React.FC<Props> = ({ alert, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const { properties } = alert;

  // Process alert data with useMemo to avoid recalculations on re-renders
  const alertData = useMemo(() => {
    // Get event color
    const eventColor =
      EVENT_COLORS[properties.event as keyof typeof EVENT_COLORS] ||
      EVENT_COLORS.default;

    // Format time information
    const timeAgo = getRelativeTime(new Date(properties.sent));

    // Calculate time left until expiration
    let timeLeft = null;
    if (properties.expires) {
      const now = new Date().getTime();
      const expires = new Date(properties.expires).getTime();
      const timeLeftMs = expires - now;

      if (timeLeftMs > 0) {
        const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (timeLeftMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        timeLeft =
          hours > 0
            ? `${hours}h ${minutes}m remaining`
            : `${minutes}m remaining`;
      }
    }

    return {
      eventColor,
      timeAgo,
      timeLeft,
    };
  }, [properties]);

  // Select the appropriate icon based on event type
  const eventIcon = useMemo(() => {
    const iconColor = alertData.eventColor;
    const size = 26; // Bigger icon
    const strokeWidth = 2;

    const eventLower = properties.event.toLowerCase();

    if (eventLower.includes('tornado')) {
      return <Wind size={size} color={iconColor} strokeWidth={strokeWidth} />;
    } else if (eventLower.includes('flood')) {
      return (
        <Droplets size={size} color={iconColor} strokeWidth={strokeWidth} />
      );
    } else if (eventLower.includes('thunderstorm')) {
      return <Zap size={size} color={iconColor} strokeWidth={strokeWidth} />;
    } else if (eventLower.includes('rain')) {
      return (
        <CloudRain size={size} color={iconColor} strokeWidth={strokeWidth} />
      );
    } else if (eventLower.includes('snow') || eventLower.includes('winter')) {
      return (
        <CloudSnow size={size} color={iconColor} strokeWidth={strokeWidth} />
      );
    } else if (eventLower.includes('dust') || eventLower.includes('fog')) {
      return (
        <CloudFog size={size} color={iconColor} strokeWidth={strokeWidth} />
      );
    } else if (eventLower.includes('wind') || eventLower.includes('marine')) {
      return <Wind size={size} color={iconColor} strokeWidth={strokeWidth} />;
    }

    return (
      <AlertTriangle size={size} color={iconColor} strokeWidth={strokeWidth} />
    );
  }, [properties.event, alertData.eventColor]);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={() => onPress(alert)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Event type header with icon */}
        <View style={styles.headerRow}>
          <View style={styles.eventInfo}>
            {eventIcon}
            <Text
              style={[styles.eventType, { color: alertData.eventColor }]}
              numberOfLines={1}
            >
              {properties.event}
            </Text>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* Main alert content */}
          <Text
            style={[styles.headline, { color: colors.text.primary }]}
            numberOfLines={3}
          >
            {properties.headline ||
              `${properties.event} for ${properties.areaDesc}`}
          </Text>

          <Text
            style={[styles.location, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {properties.areaDesc}
          </Text>
        </View>

        {/* Footer with timestamp and time remaining */}
        <View style={styles.footer}>
          <View style={styles.timeSection}>
            <View style={styles.sentTimeInfo}>
              <Clock size={16} color={colors.text.secondary} />
              <Text
                style={[styles.sentTimeText, { color: colors.text.secondary }]}
              >
                {alertData.timeAgo}
              </Text>
            </View>

            {alertData.timeLeft && (
              <Text
                style={[styles.timeLeftText, { color: alertData.eventColor }]}
              >
                {alertData.timeLeft}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.detailButton,
              { backgroundColor: colors.primary + '15' },
            ]}
            onPress={() => onPress(alert)}
          >
            <Text style={[styles.detailButtonText, { color: colors.primary }]}>
              Details
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1, // Make the container fill the available space
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex', // Ensure proper flex behavior on web
        height: '100%', // Take full height on web
        marginBottom: 32,
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginBottom: 16,
      },
    }),
  },
  content: {
    padding: 20,
    flex: 1, // Fill the container
    display: 'flex', // Ensure flex display works on web
    flexDirection: 'column', // Stack children vertically
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventType: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  bodyContent: {
    flex: 1, // This will make the body content expand to fill available space
  },
  headline: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginBottom: 10,
    lineHeight: 24,
  },
  location: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginBottom: 20,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto', // Push the footer to the bottom of the card
    paddingTop: 8,
  },
  timeSection: {
    flex: 1,
  },
  sentTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sentTimeText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  timeLeftText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  detailButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
});
