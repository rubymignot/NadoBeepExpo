import { StyleSheet } from 'react-native';
import { COLORS, LIGHT_COLORS, DARK_COLORS, FONTS } from '@/constants/theme';

// Create a function to generate styles with the current theme colors
export const createThemedStyles = (colors = LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: colors.text.primary,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: colors.text.secondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  introduction: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: colors.text.primary,
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: colors.text.primary,
    marginBottom: 16,
    lineHeight: 22,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  bold: {
    fontFamily: FONTS.semiBold,
  },
});

// Export both the function and default styles for backward compatibility
export const styles = createThemedStyles(COLORS);