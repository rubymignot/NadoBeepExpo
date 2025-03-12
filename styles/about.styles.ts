import {
  StyleSheet,
  Platform,
  Dimensions,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { COLORS, LIGHT_COLORS, DARK_COLORS, FONTS, SHADOWS, LAYOUT } from '../constants/theme';

const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';

// Create a function to generate styles with the current theme colors
export const createThemedStyles = (colors = LIGHT_COLORS) => StyleSheet.create({
  // Container and layout styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...(isWeb && {
      minHeight: '100vh',
      width: '100%',
    }),
  } as ViewStyle,
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    ...(isWeb && {
      minHeight: '100%',
    }),
  },
  innerContent: {
    width: '100%',
    maxWidth: LAYOUT.maxWidth,
    padding: LAYOUT.contentPadding,
    alignItems: 'stretch',
  },
  contentWrapper: {
    width: '100%',
    ...(isWeb && {
      maxWidth: '100%',
      padding: 0,
    }),
  },

  // App info header styles
  appInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    width: 140,
    height: 140,
    marginBottom: 0,
    marginTop: 0,
  },
  appName: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  taglineText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text.secondary,
  },

  // Section styles
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    alignSelf: 'center',
    ...(isWeb && {
      maxWidth: Math.min(LAYOUT.maxWidth, windowWidth - 48),
      marginHorizontal: 'auto',
    }),
    ...SHADOWS.small,
  },
  warningSection: {
    backgroundColor: colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    alignItems: 'center',
  },
  batterySection: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: colors.text.primary,
    marginBottom: 10,
    lineHeight: 22,
  },

  // Warning notice styles
  warningTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginVertical: 8,
  },
  warningIcon: {
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  webFeatureNote: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB74D',
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Monitoring controls
  monitoringControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monitoringTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  monitoringTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  monitoringDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: colors.text.secondary,
  },
  monitoringWarning: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  monitoringWarningText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.warning,
    marginLeft: 8,
    flex: 1,
  },
  webNoticeText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.text.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },

  // Status and diagnostics
  statusDetails: {
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  statusCardTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.text.primary,
  },
  statusValue: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.text.secondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontFamily: FONTS.medium,
    marginTop: 16,
  },

  // Button styles
  serviceControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
    flexDirection: 'row',
  },
  checkButton: {
    backgroundColor: COLORS.success,
  },
  restartButton: {
    backgroundColor: COLORS.warning,
  },
  serviceButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  buttonIcon: {
    marginRight: 8,
  },
  serviceNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 12,
  },

  // Battery settings
  batteryButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  batteryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  batteryInstructions: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  manufacturerWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 126, 34, 0.1)',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
  manufacturerWarningText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#d35400',
    marginLeft: 8,
    flex: 1,
  },

  // Test notification section
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  testButtonIcon: {
    marginRight: 8,
  },
  testDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  testingButton: {
    backgroundColor: '#7f8c8d', // Disabled state color
  },

  // Permission button
  permissionButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },

  // Alert list styles
  alertsList: {
    marginTop: 8,
  },
  alertType: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text.primary,
    marginBottom: 6,
  },

  // Link styles
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginRight: 6,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  privacyButtonIcon: {
    marginRight: 8,
  },

  // Footer styles
  footer: {
    marginTop: 24,
    alignItems: 'center',
    marginBottom: 30,
    padding: 16,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    ...SHADOWS.small,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Using explicit color since COLORS.border isn't defined
    width: '100%',
    ...(isWeb && {
      maxWidth: Math.min(LAYOUT.maxWidth, windowWidth - 48),
      marginHorizontal: 'auto',
      marginBottom: 24,
      borderRadius: 8,
      alignSelf: 'center',
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
    color: COLORS.text.primary,
  },

  // Debug section styles
  debugSection: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff3f3',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  debugIcon: {
    marginBottom: 12,
  },
  debugText: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: FONTS.medium,
  },
  debugButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 8,
    elevation: 3,
  },
  debugButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  debugDisclaimer: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    fontFamily: FONTS.regular,
  },

  // Volume control
  volumeControl: {
    width: '100%',
    marginVertical: 16,
    padding: 8,
  },
  volumeLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  volumeSlider: {
    width: '100%',
    height: 40,
  },

  // Feature grid and items
  featureGrid: Platform.select({
    web: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 24,
      marginTop: 24,
    } as ViewStyle,
    default: {
      marginTop: 16,
    },
  }),
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  featureDescription: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },

  // Image section styles
  imageSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 16,
    ...(isWeb && {
      maxWidth: Math.min(800, windowWidth - 48),
      alignSelf: 'center',
    }),
  } as ViewStyle,
  featureImage: {
    width: '100%',
    height: isWeb ? 400 : 200,
    borderRadius: 8,
    ...(isWeb && {
      objectFit: 'cover' as 'cover',
    }),
  } as ImageStyle,
  imageCaption: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
});

// Export both the function and default styles for backward compatibility
export const styles = createThemedStyles(COLORS);
