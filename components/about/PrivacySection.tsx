import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type PrivacySectionProps = {
  isDarkMode: boolean;
}

const PrivacySection = ({ isDarkMode }: PrivacySectionProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  const router = useRouter();
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Privacy</Text>
      <Text style={styles.paragraph}>
        We don't collect any personal data. NadoBeep works without tracking your location 
        or personal information.
      </Text>
      <TouchableOpacity
        style={styles.privacyButton}
        onPress={() => router.push('/(tabs)/privacy')}
      >
        <Shield size={18} color={colors.primary} style={styles.privacyButtonIcon} />
        <Text style={styles.linkText}>View Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PrivacySection;
