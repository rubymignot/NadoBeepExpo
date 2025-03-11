import React from 'react';
import { View, Text, Image } from 'react-native';
import { Info } from 'lucide-react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

const APP_ICON = require('../../assets/images/icon.png');

type AppHeaderProps = {
  version: string;
  isDarkMode: boolean;
}

const AppHeader = ({ version, isDarkMode }: AppHeaderProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  return (
    <View style={styles.appInfo}>
      <Image
        source={APP_ICON}
        style={styles.appIcon}
        resizeMode="contain"
      />
      <Text style={styles.appName}>NadoBeep</Text>
      <Text style={styles.version}>Version {version}</Text>

      <View style={styles.tagline}>
        <Info size={16} color={colors.text.secondary} />
        <Text style={styles.taglineText}>
          Tornado in the US? Beep beep!
        </Text>
      </View>
    </View>
  );
};

export default AppHeader;
