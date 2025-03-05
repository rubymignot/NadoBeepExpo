import { StyleSheet, Platform, Dimensions, ViewStyle, ImageStyle } from 'react-native';
import { COLORS, FONTS, BREAKPOINTS, LAYOUT, MAX_CONTENT_WIDTH } from '../constants/theme';

const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(isWeb && {
      minHeight: '100vh',
      width: '100%',
    }),
  } as ViewStyle,
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    ...(isWeb && {
      minHeight: '100%',
    }),
  },
  innerContent: {
    width: '100%',
    maxWidth: parseFloat(LAYOUT.pageWidth),
    padding: LAYOUT.contentPadding,
    alignItems: 'stretch',
  },
  section: {
    backgroundColor: COLORS.surface,
    marginVertical: 16,
    padding: LAYOUT.contentPadding,
    borderRadius: 8,
    width: '100%',
    alignSelf: 'center',
    ...(isWeb && {
      maxWidth: Math.min(LAYOUT.maxWidth, windowWidth - 48),
      marginHorizontal: 'auto',
    }),
  },
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
  contentWrapper: {
    width: '100%',
    ...(isWeb && {
      maxWidth: '100%',
      padding: 0,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
    ...(isWeb && {
      maxWidth: Math.min(LAYOUT.maxWidth, windowWidth - 48),
      marginHorizontal: 'auto',
      marginBottom: 24,
      borderRadius: 8,
      alignSelf: 'center',
    }),
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: '#2c3e50',
  },
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
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#3498db',
    marginRight: 6,
    fontFamily: 'Inter-Medium',
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  severityContent: {
    flex: 1,
  },
  severityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'Inter-SemiBold',
  },
  severityDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: 'Inter-Regular',
  },
  alertTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTypeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  alertTypeContent: {
    flex: 1,
  },
  alertTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'Inter-SemiBold',
  },
  alertTypeDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
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
    color: '#2c3e50',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  featureDescription: {
    flex: 1,
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  // Removed duplicate featureGrid style as it's already defined above
  warningIcon: {
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  warningText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    marginTop: 24,
    marginBottom: 30,
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
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
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  debugButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  debugDisclaimer: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    fontFamily: 'Inter-Regular',
  },
  volumeControl: {
    width: '100%',
    marginVertical: 16,
    padding: 8,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  volumeSlider: {
    width: '100%',
    height: 40,
  },
});
