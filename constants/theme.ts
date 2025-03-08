import { Platform } from 'react-native';

// Theme constants for consistent styling across the app

export const COLORS = {
  primary: '#e74c3c',
  primaryLight: '#e74c3c',
  primaryDark: '#c0392b',
  secondary: '#3498db',
  secondaryDark: '#2980b9',
  success: '#2ecc71',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
  background: '#f5f5f5',
  surface: '#ffffff',
  white: '#ffffff',
  black: '#000000',
  text: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    light: '#95a5a6',
    inverse: '#ffffff',
  },
  error: '#e74c3c',
  errorLight: '#f9dddd',
  card: '#ffffff',
  cardShadow: '#000000',
  border: '#bdc3c7',
  borderLight: '#ecf0f1',
};

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const SHADOWS = {
  small: {
    ...Platform.select({
      ios: {
        boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.1)',
      },
      android: {
        elevation: 2,
      },
    }),
  },
  medium: {
    ...Platform.select({
      ios: {
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.15)',
      },
      android: {
        elevation: 4,
      },
    }),
  },
  large: {
    ...Platform.select({
      ios: {
        boxShadow: '0px 8px 12px rgba(0, 0, 0, 0.2)',
      },
      android: {
        elevation: 8,
      },
    }),
  },
};

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

export const LAYOUT = {
  maxWidth: 1200,
  contentPadding: 16,
  pageWidth: '100%',
  cardGap: 16,
};
