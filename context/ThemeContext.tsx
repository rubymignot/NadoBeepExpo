import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/theme';

// Theme type
type ThemeType = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  colors: typeof LIGHT_COLORS;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDarkMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
  colors: LIGHT_COLORS,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const deviceColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Determine if dark mode based on theme setting and device preference
  const isDarkMode = 
    theme === 'dark' || (theme === 'system' && deviceColorScheme === 'dark');
  
  // Current theme colors based on mode
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  
  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    
    loadThemePreference();
    
    // Listen for changes to the device appearance
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only update if using system theme
      if (theme === 'system') {
        // Force re-render
        setThemeState('system');
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [theme]);
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  // Set theme and save to storage
  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('themePreference', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
