import React from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { AlertItem } from './AlertItem';
import { Alert } from '../../types/alerts';
import { BREAKPOINTS } from '../../constants/theme';

interface WebAlertGridProps {
  alerts: Alert[];
  onPress: (alert: Alert) => void;
}

export function WebAlertGrid({ alerts, onPress }: WebAlertGridProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= BREAKPOINTS.tablet;

  return (
    <View style={[styles.grid, isLargeScreen && styles.gridLarge]}>
      {alerts.map((alert) => (
        <View key={alert.properties.id} style={styles.gridItem}>
          <AlertItem alert={alert} onPress={onPress} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  } as ViewStyle,
  gridLarge: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '16px',
    alignItems: 'stretch',
    gridAutoRows: '1fr', // force equal row heights
  } as any, // Use 'any' to bypass TypeScript checking for web-specific CSS Grid properties
  gridItem: {
    // Removed height: '100%'
  } as ViewStyle,
});
