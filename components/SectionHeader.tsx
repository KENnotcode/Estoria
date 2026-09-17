import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../hooks/useColors';

export function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.seeAll}>
          <Text style={[styles.link, { color: colors.mutedForeground }]}>See all</Text>
          <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 19, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});