import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type DataSourceSectionProps = {
  isDarkMode: boolean;
}

const DataSourceSection = ({ isDarkMode }: DataSourceSectionProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't open link", err));
  };
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Data Source</Text>
      <Text style={styles.paragraph}>
        All weather alert data is sourced from the National Weather Service
        (NWS) API.
      </Text>
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => openLink('https://www.weather.gov/')}
      >
        <Text style={styles.linkText}>Visit National Weather Service</Text>
        <ExternalLink size={16} color={colors.primary} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Weather Safety Resources</Text>
      <Text style={styles.paragraph}>
        Learn how to prepare for and stay safe during severe weather events.
      </Text>
      
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => openLink('https://www.weather.gov/safety/')}
      >
        <Text style={styles.linkText}>NWS Weather Safety</Text>
        <ExternalLink size={16} color={colors.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => openLink('https://www.ready.gov/severe-weather')}
      >
        <Text style={styles.linkText}>Ready.gov Weather Preparedness</Text>
        <ExternalLink size={16} color={colors.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => openLink('https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/tornado.html')}
      >
        <Text style={styles.linkText}>Red Cross Tornado Safety</Text>
        <ExternalLink size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default DataSourceSection;
