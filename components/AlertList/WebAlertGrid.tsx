import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertItem } from './AlertItem';
import { Alert } from '../../types/alerts';
import { BREAKPOINTS, LAYOUT } from '../../constants/theme';

interface WebAlertGridProps {
  alerts: Alert[];
  onPress: (alert: Alert) => void;
}

export function WebAlertGrid({ alerts, onPress }: WebAlertGridProps) {
  return (
    <View style={styles.grid}>
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
    maxWidth: LAYOUT.maxWidth,
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${BREAKPOINTS.tablet/2.2}px, 1fr))`,
    gap: LAYOUT.cardGap,
    padding: LAYOUT.contentPadding,
  } as any,
  gridItem: {
    width: '100%',
  },
});
