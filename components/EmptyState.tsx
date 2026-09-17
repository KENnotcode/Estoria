import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../hooks/useColors';

export function EmptyState({ title, message, actionLabel, onAction, icon = 'film' }: { title: string; message: string; actionLabel?: string; onAction?: () => void; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.card }]}><Feather name={icon} size={24} color={colors.primary} /></View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
      {actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={[styles.action, { backgroundColor: colors.primary }]}><Text style={[styles.actionText, { color: colors.primaryForeground }]}>{actionLabel}</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, minHeight: 330 },
  icon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  message: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8 },
  action: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 22 },
  actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});