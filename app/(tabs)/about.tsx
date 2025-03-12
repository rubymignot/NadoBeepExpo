import {
  View,
  ScrollView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';
import { createThemedStyles } from '@/styles/about.styles';
import { useRouter } from 'expo-router';
import { Settings, ArrowRight, ArrowLeft } from 'lucide-react-native';

// Import about-related components
import {
  SafetyNotice,
  AboutSection,
  HowItWorks,
  AlertTypes,
  DataSourceSection,
  PrivacySection,
  Footer,
  GovDisclaimer,
} from '@/components/about';

const isWeb = Platform.OS === 'web';

export default function AboutScreen() {
  const router = useRouter();
  const { isDarkMode, colors } = useTheme();
  const styles = createThemedStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      <View
        style={{
          position: 'absolute',
          top: 32,
          left: 16,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            backgroundColor: isDarkMode
              ? 'rgba(30,30,30,0.7)'
              : 'rgba(240,240,240,0.7)',
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={18} color={colors.primary} />
          <Text style={{ marginLeft: 4, color: colors.text.primary }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: isWeb ? 60 : 16,
          paddingTop: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SafetyNotice isDarkMode={isDarkMode} />

        <GovDisclaimer isDarkMode={isDarkMode} />

        <AboutSection isDarkMode={isDarkMode} />

        <HowItWorks isDarkMode={isDarkMode} />

        <AlertTypes isDarkMode={isDarkMode} />

        <DataSourceSection isDarkMode={isDarkMode} />

        <PrivacySection isDarkMode={isDarkMode} />

        <Footer isDarkMode={isDarkMode} />
      </ScrollView>
    </SafeAreaView>
  );
}
