import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

const APP_ICON = require('../../assets/images/icon.png');

export function LoadingState() {
  return (
    <View style={styles.centered}>
      <Image
        source={APP_ICON}
        style={styles.headerLogo}
        defaultSource={APP_ICON}
      />
      <ActivityIndicator size="large" color="#e74c3c" />
      <Text style={styles.loadingText}>Loading alerts...</Text>
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
    color: '#7f8c8d',
    fontFamily: 'Inter-Medium',
  },
});
