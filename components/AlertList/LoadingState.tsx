import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FONTS } from '@/constants/theme';

const APP_ICON = require('../../assets/images/icon.png');

export function LoadingState() {
  const { colors } = useTheme();

  return (
    <View style={styles.centered}>
      <Image
        source={APP_ICON}
        style={styles.headerLogo}
        defaultSource={APP_ICON}
      />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
        Loading alerts...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerLogo: {
    width: 64,
    height: 64,
    marginBottom: 24,
    borderRadius: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    // color moved to component for theming
    fontFamily: FONTS.medium,
  },
});
