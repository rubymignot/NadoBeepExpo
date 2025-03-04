import { Platform } from 'react-native';

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const COLORS = {
  primary: '#e74c3c',
  primaryDark: '#c0392b',
  primaryLight: '#f9c4c0',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    light: '#95a5a6',
    onPrimary: '#ffffff',
  },
  border: '#e0e0e0',
  white: '#fff',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
};

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
};

export const MAX_CONTENT_WIDTH = 1200;

export const LAYOUT = {
  pageWidth: Platform.select({
    web: '100%',
    default: '100%',
  }),
  maxWidth: 1200,
  contentPadding: Platform.select({
    web: 24,
    default: 16,
  }),
  cardGap: 24,
  contentWidth: {
    desktop: 960,
    tablet: 720,
    mobile: '100%',
  },
} as const;
