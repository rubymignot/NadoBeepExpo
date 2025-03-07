import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { COLORS, FONTS } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

          <Text style={styles.introduction}>
            NadoBeep is committed to protecting your privacy. This Privacy Policy explains how we handle 
            information in relation to our mobile and web application.
          </Text>

          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.paragraph}>
            • We do not collect personal information
            {'\n'}• We do not track your location
            {'\n'}• We do not share any data with third parties
            {'\n'}• We only use the National Weather Service API to display weather alerts
          </Text>

          <Text style={styles.sectionTitle}>Information We Don't Collect</Text>
          <Text style={styles.paragraph}>
            NadoBeep doesn't collect, store, or transmit any personal information about you. 
            We don't require you to create an account, and we don't track your location or 
            usage patterns.
          </Text>

          <Text style={styles.sectionTitle}>Weather Alert Data</Text>
          <Text style={styles.paragraph}>
            NadoBeep fetches weather alert data directly from the National Weather Service API. 
            We do not store this data on our servers - it is fetched directly from the NWS API 
            to your device, where it is temporarily stored only for the purpose of displaying 
            relevant alerts.
          </Text>

          <Text style={styles.sectionTitle}>Device Permissions</Text>
          <Text style={styles.paragraph}>
            To provide you with weather alerts, NadoBeep may request the following permissions:
            {'\n\n'}
            <Text style={styles.bold}>Notifications:</Text> Required to display weather alerts even when 
            the app is not actively being used.
            {'\n\n'}
            <Text style={styles.bold}>Audio:</Text> Required to play the alert sounds for tornado warnings.
          </Text>

          <Text style={styles.sectionTitle}>Local Storage</Text>
          <Text style={styles.paragraph}>
            NadoBeep stores minimal data on your device using local storage. This includes:
            {'\n\n'}
            • Your settings preferences (sound on/off, notification preferences)
            {'\n'}• IDs of alerts you have already seen (to prevent duplicate notifications)
            {'\n\n'}
            This information stays on your device and is never transmitted to us or any third parties.
          </Text>

          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.paragraph}>
            NadoBeep uses the National Weather Service (NWS) API to retrieve weather alert data.
            Your use of our app is subject to the NWS's own terms and policies, which you can review
            at their website.
          </Text>

          <Text style={styles.sectionTitle}>Analytics and Crash Reporting</Text>
          <Text style={styles.paragraph}>
            NadoBeep does not use any third-party analytics or crash reporting services that would 
            collect information about your use of the app.
          </Text>

          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.paragraph}>
            NadoBeep does not collect information from anyone, including children under the age of 13.
          </Text>

          <Text style={styles.sectionTitle}>Changes To This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page. You are advised to review this Privacy 
            Policy periodically for any changes.
          </Text>

          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us on social media.
            {'\n'}
            GitHub: https://github.com/rubynouille/NadoBeepExpo
            {'\n'}
            Twitter: https://twitter.com/rubynouille
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.text.primary,
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  introduction: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.text.primary,
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text.primary,
    marginBottom: 16,
    lineHeight: 22,
  },
  bold: {
    fontFamily: FONTS.semiBold,
  },
});
