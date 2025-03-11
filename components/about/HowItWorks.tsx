import React from 'react';
import { View, Text } from 'react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type HowItWorksProps = {
  isDarkMode: boolean;
}

const HowItWorks = ({ isDarkMode }: HowItWorksProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How It Works</Text>
      <Text style={styles.paragraph}>
        • Fetches alerts from the NWS API every 30 seconds
      </Text>
      <Text style={styles.paragraph}>
        • Filters for county-based alerts with polygon geometries
      </Text>
      <Text style={styles.paragraph}>
        • Displays notifications for new alerts
      </Text>
      <Text style={styles.paragraph}>
        • Plays alarm sound for tornado warnings
      </Text>
    </View>
  );
};

export default HowItWorks;
