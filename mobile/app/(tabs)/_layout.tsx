/**
 * Tabs Layout - Main App Navigation
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store/auth';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { activeRole } = useAuthStore();

  const isPatient = activeRole === 'PATIENT';
  const isTherapist = activeRole === 'THERAPIST';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isTherapist ? 'Inbox' : 'Beranda',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name={isTherapist ? 'mail' : 'home'} color={color} />
          ),
        }}
      />

      {/* Patient: Booking Tab (Hidden for Therapist) */}
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          href: isPatient ? '/(tabs)/booking' : null,
          tabBarIcon: ({ color }) => <TabBarIcon name="add-circle" color={color} />,
          headerShown: false, // Stack header handles it
        }}
      />

      {/* Shared: Bookings List / Schedule */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: isTherapist ? 'Jadwal' : 'Pesanan',
          href: (isPatient || isTherapist) ? '/(tabs)/bookings' : null,
          tabBarIcon: ({ color }) => <TabBarIcon name={isTherapist ? 'calendar' : 'list'} color={color} />,
        }}
      />

      {/* Therapist: Wallet */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          href: isTherapist ? '/(tabs)/wallet' : null,
          tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} />,
        }}
      />

      {/* Hidden: Booking Detail (accessed from list) */}
      <Tabs.Screen
        name="booking-detail"
        options={{
          title: 'Detail Booking',
          href: null, // Hidden from tab bar
          headerShown: true,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          href: (isPatient || isTherapist) ? '/(tabs)/profile' : null,
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
