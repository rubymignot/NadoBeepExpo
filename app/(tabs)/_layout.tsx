import React from 'react';
import { Tabs } from 'expo-router';
import { MapPin, Bell, InfoIcon } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
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