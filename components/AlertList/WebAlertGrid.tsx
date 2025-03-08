import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AlertTriangle, Clock } from 'lucide-react-native';
import { Alert } from '@/types/alerts';
import { EVENT_COLORS, SEVERITY_COLORS } from '@/constants/alerts';
import { getRelativeTime } from '@/utils/dateUtils';
import { BREAKPOINTS, FONTS, LAYOUT } from '@/constants/theme';
import { Dimensions } from 'react-native';

interface Props {
  alerts: Alert[];
  onPress: (alert: Alert) => void;
}

export const WebAlertGrid: React.FC<Props> = ({ alerts, onPress }) => {
  const windowWidth = Dimensions.get('window').width;
  
  // Determine number of columns based on screen width
  const getNumColumns = () => {
    if (windowWidth >= BREAKPOINTS.desktop) return 3;
    if (windowWidth >= BREAKPOINTS.tablet) return 2;
    return 1;
  };
  
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

  // Render an individual alert card
  const renderItem = ({ item }: { item: Alert }) => {
    const { properties } = item;
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardBorder, { backgroundColor: getEventColor(properties.event) }]} />
        
        <View style={styles.cardHeader}>
          <Text style={styles.eventType}>{properties.event}</Text>
          <Text 
            style={[
              styles.severity, 
              { backgroundColor: getSeverityColor(properties.severity) }
            ]}
          >
            {properties.severity}
          </Text>
        </View>
        
        <Text style={styles.headline} numberOfLines={3}>
          {properties.headline || `${properties.event} for ${properties.areaDesc}`}
        </Text>
        
        <Text style={styles.areaDesc} numberOfLines={2}>
          {properties.areaDesc}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.timeInfo}>
            <Clock size={14} color="#7f8c8d" />
            <Text style={styles.timeText}>
              {getTimeAgo(properties.sent)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.detailButton} 
            onPress={() => onPress(item)}
          >
            <Text style={styles.detailButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        renderItem={renderItem}
        keyExtractor={(item) => item.properties.id}
        numColumns={getNumColumns()}
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={getNumColumns() > 1 ? styles.gridRow : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: LAYOUT.maxWidth,
    marginHorizontal: 'auto',
  },
  grid: {
    flex: 1,
    width: '100%',
  },
  gridContent: {
    padding: 8,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    overflow: 'hidden',
    elevation: 2,
    flex: 1,
    minWidth: 250,
    maxWidth: 400,
  },
  cardBorder: {
    height: 4,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  eventType: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#2c3e50',
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
    color: '#34495e',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  areaDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#7f8c8d',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    padding: 12,
    paddingTop: 10,
    marginTop: 'auto',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  detailButton: {
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  detailButtonText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#7f8c8d',
  },
});
