import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Alert } from '@/types/alerts';
import { BREAKPOINTS, LAYOUT } from '@/constants/theme';
import { Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { AlertItem } from './AlertItem';

interface Props {
  alerts: Alert[];
  onPress: (alert: Alert) => void;
}

export const WebAlertGrid: React.FC<Props> = ({ alerts, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const windowWidth = Dimensions.get('window').width;
  
  // Determine number of columns based on screen width
  const getNumColumns = () => {
    if (windowWidth >= BREAKPOINTS.desktop) return 3;
    if (windowWidth >= BREAKPOINTS.tablet) return 2;
    return 1;
  };

  // Render an individual alert card using the AlertItem component
  const renderItem = ({ item }: { item: Alert }) => {
    return (
      <View style={styles.cardWrapper}>
        <AlertItem alert={item} onPress={onPress} />
      </View>
    );
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        renderItem={renderItem}
        keyExtractor={(item) => item.properties.id}
        numColumns={getNumColumns()}
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={getNumColumns() > 1 ? styles.gridRow : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: LAYOUT.maxWidth,
    marginHorizontal: 'auto',
  },
  grid: {
    flex: 1,
    width: '100%',
  },
  gridContent: {
    padding: 12,
  },
  gridRow: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  cardWrapper: {
    flex: 1,
    margin: 12,
    height: '100%',
  }
});
