import { Platform } from 'react-native';

// Theme constants for consistent styling across the app

export const COLORS = {
  primary: '#e74c3c',
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
};

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
