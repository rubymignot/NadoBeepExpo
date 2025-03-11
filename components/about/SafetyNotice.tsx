import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type SafetyNoticeProps = {
  isDarkMode: boolean;
}

const SafetyNotice = ({ isDarkMode }: SafetyNoticeProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  return (
    <View style={[styles.section, styles.warningSection]}>
      <AlertTriangle size={24} color="#e74c3c" />
      <Text style={styles.warningTitle}>IMPORTANT SAFETY NOTICE</Text>
      <Text style={styles.paragraph}>
        This app is for informational purposes only and should NOT be used
        as your primary source for weather alerts. Always follow official
        guidance from local emergency management officials during severe
        weather events.
      </Text>
    </View>
  );
};

export default SafetyNotice;
