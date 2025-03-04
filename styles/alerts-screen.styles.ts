import { StyleSheet, Platform, Dimensions, ViewStyle, ImageStyle } from 'react-native';
import { COLORS, FONTS, SHADOWS, BREAKPOINTS, LAYOUT } from '../constants/theme';

const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';

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
    maxWidth: typeof LAYOUT.pageWidth === 'string' ? parseInt(LAYOUT.pageWidth, 10) : LAYOUT.pageWidth,
    alignSelf: 'center',
  },
  headerGradient: {
    width: '100%',
    height: Platform.OS === 'ios' ? 80 : 65,
    justifyContent: 'flex-end', // Align content to bottom of gradient
  },
  header: {
    width: '100%',
    maxWidth: isWeb ? Math.min(LAYOUT.maxWidth, windowWidth - 48) : '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.contentPadding,
    height: 44, // Fixed height for header
    marginBottom: 8, // Add some space at the bottom
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%', // Fill header height
  },
  headerLogo: {
    width: 28, // Slightly smaller logo
    height: 28,
    marginRight: 8,
    borderRadius: 14,
  } as ImageStyle,
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
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
});
