import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Alert } from '../../types/alerts';
import { EVENT_COLORS, SEVERITY_COLORS } from '../../constants/alerts';
import { getRelativeTime } from '../../utils/dateUtils';
import { COLORS, FONTS } from '@/constants/theme';

interface AlertItemProps {
  alert: Alert;
  onPress: (alert: Alert) => void;
}

export function AlertItem({ alert, onPress }: AlertItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.alertCard,
        {
          borderLeftColor: EVENT_COLORS[alert.properties.event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default,
          borderLeftWidth: alert.properties.event === 'Tornado Warning' ? 8 : 5,
        },
      ]}
      onPress={() => onPress(alert)}
    >
      <View style={styles.alertHeader}>
        <Text
          style={[
            styles.alertType,
            { color: EVENT_COLORS[alert.properties.event as keyof typeof EVENT_COLORS] || EVENT_COLORS.default },
          ]}
        >
          {alert.properties.event}
        </Text>
        <Text
          style={[
            styles.severityBadge,
            {
              backgroundColor: SEVERITY_COLORS[alert.properties.severity.toLowerCase() as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.unknown,
            },
          ]}
        >
          {alert.properties.severity}
        </Text>
      </View>
      <Text style={styles.issuedTime}>
        Issued: {getRelativeTime(alert.properties.sent)}
      </Text>
      <Text style={styles.headline}>{alert.properties.headline}</Text>
      <Text style={styles.areaDesc}>{alert.properties.areaDesc}</Text>
      <View style={styles.alertFooter}>
        {alert.properties.event === 'Tornado Warning' && (
          <View style={styles.tornadoWarning}>
            <AlertTriangle size={16} color="#fff" />
            <Text style={styles.tornadoWarningText}>TORNADO WARNING</Text>
          </View>
        )}
        <Text style={styles.timeInfo}>
          Expires: {formatDate(alert.properties.expires)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Platform.select({
      android: 12,
      default: 16,
    }),
    marginBottom: Platform.select({
      android: 12,
      default: 16,
    }),
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    transform: [{ scale: 1 }],
    position: 'relative',
    ...Platform.select({
      web: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      },
    }),
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 15,
    marginBottom: 8,
    color: '#34495e',
    fontFamily: 'Inter-Medium',
  },
  areaDesc: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    fontSize: 12,
    color: '#95a5a6',
    fontFamily: 'Inter-Regular',
  },
  tornadoWarning: {
    backgroundColor: '#7b241c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  tornadoWarningText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'Inter-Bold',
  },
  issuedTime: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: FONTS.regular,
    marginTop: 8,
    marginBottom: 12,
  },
});
