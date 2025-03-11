import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

const isWeb = Platform.OS === 'web';

type AboutSectionProps = {
  isDarkMode: boolean;
}

const AboutSection = ({ isDarkMode }: AboutSectionProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  return (
    <View style={[
      styles.section, 
      { backgroundColor: colors.surface }
    ]}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About This App</Text>
      <Text style={[styles.paragraph, { color: colors.text.primary }]}>
        NadoBeep is a fun enthusiast project that checks the US National Weather Service API 
        for severe weather alerts. It tracks county-based alerts with
        polygon geometries like Tornado Warnings, Flood Warnings, and Severe
        Thunderstorm Warnings. This is not an official safety app and only covers US alerts.
      </Text>
      <Text style={[styles.paragraph, { color: colors.text.primary }]}>
        When the app spots a severe weather alert, you'll get a notification
        with the alert details. For tornado warnings, the app plays a special 
        alarm sound to get your attention even if you're not looking at your device.
      </Text>
      {isWeb && (
        <Text style={[
          styles.paragraph, 
          styles.webFeatureNote,
          { 
            backgroundColor: isDarkMode ? 'rgba(255, 183, 77, 0.15)' : '#FFF8E1',
            borderLeftColor: colors.warning,
            color: colors.text.primary
          }
        ]}>
          On web browsers, notifications will only appear when this tab is
          open and active. For reliable background notifications, consider
          installing the mobile app.
        </Text>
      )}
    </View>
  );
};

export default AboutSection;
