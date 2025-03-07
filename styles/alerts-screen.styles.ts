import {
  StyleSheet,
  Platform,
  Dimensions,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import {
  COLORS,
  FONTS,
  SHADOWS,
  BREAKPOINTS,
  LAYOUT,
} from '../constants/theme';

const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';
const MOBILE_BREAKPOINT = 600;
const isMobile = windowWidth < MOBILE_BREAKPOINT;

const getCardWidth = () => {
  if (!isWeb) return '100%';
  if (windowWidth >= BREAKPOINTS.desktop) {
    const width = (LAYOUT.maxWidth - LAYOUT.cardGap * 2) / 3;
    return `${width}px`;
  }
  if (windowWidth >= BREAKPOINTS.tablet) {
    const width = (LAYOUT.maxWidth - LAYOUT.cardGap) / 2;
    return `${width}px`;
  }
  return '100%';
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth:
      typeof LAYOUT.pageWidth === 'string'
        ? parseInt(LAYOUT.pageWidth, 10)
        : LAYOUT.pageWidth,
    alignSelf: 'center',
  },
  headerGradient: {
    width: '100%',
    height: Platform.select({
      ios: 80,
      android: 80,
      web: 65,
    }),
    paddingTop: Platform.select({
      ios: 35,
      android: 25,
      web: 0,
    }),
    justifyContent: 'flex-end', // Align content to bottom of gradient
    alignItems: 'center', // Center horizontally
  },
  header: {
    width: '100%',
    maxWidth: isWeb ? (windowWidth > 768 ? Math.min(LAYOUT.maxWidth, windowWidth - 48) : windowWidth - 24) : '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Platform.select({
      web: windowWidth > 768 ? LAYOUT.contentPadding : 12, 
      android: 16,
      ios: LAYOUT.contentPadding,
    }),
    height: 50, // Fixed height for header
    marginBottom: 8, // Add some space at the bottom
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%', // Fill header height
    flex: 1, // Take available space
    // More space around logo when title is hidden
    justifyContent: isMobile ? 'flex-start' : 'flex-start',
  },
  headerLogo: {
    width: 28, // Slightly smaller logo
    height: 28,
    marginRight: isMobile ? 0 : 8, // No margin needed when title is hidden
    borderRadius: 14,
  } as ImageStyle,
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginLeft: 8, // Consistent spacing from logo
    flex: 1, // Allow text to compress if needed
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Ensure buttons stay right-aligned
    minWidth: Platform.select({
      web: windowWidth > 768 ? 180 : (isMobile ? 120 : 140),
      default: isMobile ? 120 : 140,
    }),
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: isMobile ? 6 : 4,
    marginLeft: 8,
    width: Platform.select({
      web: isMobile ? 150 : 150,  // Wider on mobile web (was 100)
      default: isMobile ? 140 : 130,  // Wider on mobile native (was 100)
    }),
  },
  volumeSlider: {
    flex: 1,
    height: isMobile ? 40 : 32,
    marginHorizontal: 8,
    // Make touch target bigger on mobile
    ...(isMobile && {
      minHeight: 40,
    }),
  },
  volumeIconButton: {
    padding: 4,
    borderRadius: 16,
  },
  headerIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',  // Darker background when disabled
    opacity: 0.7,                           // More obvious disabled state
  },
  filterInfo: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  filterText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  refreshText: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.text.light,
    textAlign: 'center',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listWrapper: {
    flex: 1,
    width: '100%',
    ...(isWeb && {
      overflow: 'auto',
      padding: LAYOUT.contentPadding,
    }),
    ...(Platform.OS === 'android' && {
      paddingHorizontal: 16,
    }),
  } as ViewStyle,
  listContent: {
    width: '100%',
    maxWidth: LAYOUT.maxWidth,
    marginHorizontal: 'auto',
  } as ViewStyle,
  placeholderImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  } as ImageStyle,
  noAlertsText: {
    fontSize: 20,
    color: COLORS.text.primary,
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 20,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  notificationsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    padding: 10,
    paddingHorizontal: 16,
    width: '100%',
  },
  notificationsBannerText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
    // When in grid on web, fill the container height
    ...(isWeb && {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
    }),
  } as ViewStyle,
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: FONTS.medium,
  },
  errorText: {
    marginTop: 10,
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  // Add responsive styles for smaller screens
  '@media (max-width: 360px)': {
    headerButtons: {
      minWidth: 120,
    },
    volumeControl: {
      width: 100,
    }
  } as any
});
