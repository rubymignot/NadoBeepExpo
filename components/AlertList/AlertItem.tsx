import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, Clock } from 'lucide-react-native';
import { Alert } from '@/types/alerts';
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
  
  // Get color for the event type 
  const getEventColor = (event: string) => {
    return EVENT_COLORS[event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
  };
  
  // Get color for severity
  const getSeverityColor = (severity: string) => {
    return SEVERITY_COLORS[severity.toLowerCase() as keyof typeof SEVERITY_COLORS] || 
      SEVERITY_COLORS.unknown;
  };

  // Format relative time
  const getTimeAgo = (dateString: string) => {
    return getRelativeTime(new Date(dateString));
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: colors.surface }
      ]} 
      onPress={() => onPress(alert)}
      activeOpacity={0.7}
    >
      <View style={[styles.leftBorder, { backgroundColor: getEventColor(properties.event) }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.eventType, { color: colors.text.primary }]}>
            {properties.event}
          </Text>
          <Text 
            style={[
              styles.severity, 
              { backgroundColor: getSeverityColor(properties.severity) }
            ]}
          >
            {properties.severity}
          </Text>
        </View>
        
        <Text style={[styles.headline, { color: colors.text.primary }]} numberOfLines={2}>
          {properties.headline || `${properties.event} for ${properties.areaDesc}`}
        </Text>
        
        <Text style={[styles.areaDesc, { color: colors.text.secondary }]} numberOfLines={1}>
          {properties.areaDesc}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.timeInfo}>
            <Clock size={14} color={colors.text.secondary} />
            <Text style={[styles.timeText, { color: colors.text.secondary }]}>
              {getTimeAgo(properties.sent)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.detailButton, { backgroundColor: isDarkMode ? '#333' : '#f4f4f4' }]} 
            onPress={() => onPress(alert)}
          >
            <Text style={[styles.detailButtonText, { color: colors.text.secondary }]}>
              Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor moved to component for theming
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
  },
  leftBorder: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    // color moved to component for theming
  },
  severity: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#fff',
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    // color moved to component for theming
    marginBottom: 6,
    lineHeight: 20,
  },
  areaDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    // color moved to component for theming
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    // color moved to component for theming
    marginLeft: 4,
  },
  detailButton: {
    // backgroundColor moved to component for theming
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  detailButtonText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    // color moved to component for theming
  },
});
