import React from 'react';
import { Tabs } from 'expo-router';
import { Bell, InfoIcon, Map } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function TabsLayout() {
  const { isDarkMode, colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDarkMode ? '#999' : '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 4,
        },
        tabBarStyle: {
          height: 72, // Make tabs taller
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? '#333' : '#f0f0f0',
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          paddingBottom: 6, // Add padding at the bottom for better touch area
        },
        tabBarItemStyle: {
          paddingVertical: 6, // Additional padding for the tab items
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }) => <InfoIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alert-details"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="privacy"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}