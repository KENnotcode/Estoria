import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '../../../hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { SymbolView } from 'expo-symbols';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favorites">
        <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} />
        <NativeTabs.Trigger.Label>Favorites</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function resolveIconColor(color: unknown, fallback: string): string {
  return typeof color === 'string' ? color : fallback;
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          !isWeb ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(12, 13, 16, 0.58)' }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(12, 13, 16, 0.92)' },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => {
            const iconColor = resolveIconColor(color, colors.mutedForeground);
            return isIOS ? (
              <SymbolView name="house" tintColor={iconColor} size={24} />
            ) : (
              <Feather name="home" size={22} color={iconColor} />
            );
          },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => {
            const iconColor = resolveIconColor(color, colors.mutedForeground);
            return isIOS
              ? <SymbolView name="magnifyingglass" tintColor={iconColor} size={24} />
              : <Feather name="search" size={22} color={iconColor} />;
          },
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => {
            const iconColor = resolveIconColor(color, colors.mutedForeground);
            return isIOS
              ? <SymbolView name="heart" tintColor={iconColor} size={24} />
              : <Feather name="heart" size={22} color={iconColor} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => {
            const iconColor = resolveIconColor(color, colors.mutedForeground);
            return isIOS
              ? <SymbolView name="person" tintColor={iconColor} size={24} />
              : <Feather name="user" size={22} color={iconColor} />;
          },
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
