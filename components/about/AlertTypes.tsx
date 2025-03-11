import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';
import { EVENT_COLORS } from '@/constants/alerts';
import { AlertEvent } from '@/types/alerts';
import { AlertTriangle, CloudLightning, Droplet, Wind } from 'lucide-react-native';

type AlertTypesProps = {
  isDarkMode: boolean;
}

const AlertTypes = ({ isDarkMode }: AlertTypesProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  
  // Group alerts by category
  const alertCategories = {
    'Tornado': ['Tornado Warning'],
    'Flood': ['Flash Flood Warning', 'Flash Flood Statement', 'Flood Warning', 'Flood Statement'],
    'Storm': ['Severe Thunderstorm Warning', 'Special Marine Warning', 'Severe Weather Statement'],
    'Other': ['Snow Squall Warning', 'Dust Storm Warning', 'Dust Storm Advisory', 'Extreme Wind Warning']
  };

  // Alert descriptions for expanded view
  const alertDescriptions = {
    'Tornado Warning': 'Issued when a tornado is indicated by radar or sighted by spotters.',
    'Flash Flood Warning': 'Issued when flash flooding is imminent or occurring.',
    'Flash Flood Statement': 'Follow-up information regarding a flash flood event.',
    'Flood Warning': 'Issued when flooding is imminent or occurring.',
    'Flood Statement': 'Follow-up information regarding flood conditions.',
    'Severe Thunderstorm Warning': 'Issued when a thunderstorm produces hail 1 inch or larger and/or winds of 58 mph or higher.',
    'Special Marine Warning': 'Warns of hazardous weather conditions over water.',
    'Severe Weather Statement': 'Follow-up information on severe weather conditions.',
    'Snow Squall Warning': 'Warns of brief intense snow with strong winds causing whiteout conditions.',
    'Dust Storm Warning': 'Issued when visibility is reduced to ¼ mile or less due to dust or sand.',
    'Dust Storm Advisory': 'Warns of reduced visibility from blowing dust.',
    'Extreme Wind Warning': 'Issued for extreme sustained winds of 115 mph or higher.'
  };

  // Get icon for each category
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Tornado':
        return <Wind size={24} color={colors.text.primary} />;
      case 'Flood':
        return <Droplet size={24} color={colors.text.primary} />;
      case 'Storm':
        return <CloudLightning size={24} color={colors.text.primary} />;
      default:
        return <AlertTriangle size={24} color={colors.text.primary} />;
    }
  };

  // Handle alert press to expand/collapse
  const toggleAlert = (alertType: string) => {
    if (expandedAlert === alertType) {
      setExpandedAlert(null);
    } else {
      setExpandedAlert(alertType);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Supported Alert Types</Text>
      <Text style={[styles.paragraph, { marginBottom: 16 }]}>
        The app monitors these emergency alerts from the National Weather Service:
      </Text>
      
      <ScrollView>
        {Object.entries(alertCategories).map(([category, alerts]) => (
          <View key={category} style={localStyles.categoryContainer}>
            <View style={[
              localStyles.categoryHeader, 
              { backgroundColor: isDarkMode ? colors.background : colors.background }
            ]}>
              {getCategoryIcon(category)}
              <Text style={[localStyles.categoryTitle, { color: colors.text.primary }]}>
                {category} Alerts
              </Text>
            </View>
            
            {alerts.map((alertType) => (
              <TouchableOpacity 
                key={alertType}
                style={[
                  localStyles.alertCard,
                  { 
                    backgroundColor: isDarkMode ? colors.background : '#ffffff',
                    borderLeftColor: EVENT_COLORS[alertType as keyof typeof EVENT_COLORS] || EVENT_COLORS.default
                  }
                ]}
                onPress={() => toggleAlert(alertType)}
                activeOpacity={0.7}
              >
                <View style={localStyles.alertHeader}>
                  <View style={[
                    localStyles.alertIndicator, 
                    { backgroundColor: EVENT_COLORS[alertType as keyof typeof EVENT_COLORS] || EVENT_COLORS.default }
                  ]} />
                  <Text style={[localStyles.alertType, { color: colors.text.primary }]}>
                    {alertType}
                  </Text>
                </View>
                
                {expandedAlert === alertType && (
                  <View style={localStyles.expandedContent}>
                    <Text style={[localStyles.alertDescription, { color: colors.text.secondary }]}>
                      {alertDescriptions[alertType as keyof typeof alertDescriptions]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  categoryContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  alertCard: {
    padding: 15,
    marginVertical: 4,
    borderLeftWidth: 5,
    borderRadius: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AlertTypes;
