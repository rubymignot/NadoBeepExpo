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
    elevation: 2,
  },
  medium: {
    elevation: 4,
  },
  large: {
      android: {
        elevation: 8,
      },
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
