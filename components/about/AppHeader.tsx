import React from 'react';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { Info } from 'lucide-react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

const APP_ICON = require('../../assets/images/android/mipmap-xxxhdpi/ic_launcher_foreground.png');

type AppHeaderProps = {
  version: string;
  isDarkMode: boolean;
}

const AppHeader = ({ version, isDarkMode }: AppHeaderProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  return (
    <TouchableOpacity onPress={() => router.push('/(tabs)/about')}>
    <View style={[styles.appInfo]}>
      <Image
      source={APP_ICON}
      style={[styles.appIcon, { 
        backgroundColor: '#e74c3c', 
        borderRadius: 10, 
        marginVertical: Platform.OS === 'web' ? 20 : 40 
      }]}
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
    </TouchableOpacity>
  );
};

export default AppHeader;
