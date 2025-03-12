import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Bug } from 'lucide-react-native';
import { Platform } from 'react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

const isWeb = Platform.OS === 'web';

type TestFunctionsProps = {
  isDarkMode: boolean;
  testingSound: boolean;
  testTornadoWarning: () => Promise<void>;
}

const TestFunctions = ({ isDarkMode, testingSound, testTornadoWarning }: TestFunctionsProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Test Functions</Text>
      <TouchableOpacity
        style={[styles.testButton, testingSound && styles.testingButton]}
        onPress={testTornadoWarning}
        disabled={testingSound}
      >
        {testingSound ? (
          <>
            <ActivityIndicator
              size="small"
              color="#fff"
              style={styles.testButtonIcon}
            />
            <Text style={styles.testButtonText}>
              Testing (5 seconds)...
            </Text>
          </>
        ) : (
          <>
            <Bug size={18} color="#fff" style={styles.testButtonIcon} />
            <Text style={styles.testButtonText}>Test Sound Alert Warning</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.testDescription}>
        This will play the warning sound for 5 seconds and show a
        Tornado Warning test notification.
      </Text>
    </View>
  );
};

export default TestFunctions;
