import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../hooks/useColors';

export function SearchBar({ onPress, value, onChangeText }: { onPress?: () => void; value?: string; onChangeText?: (value: string) => void }) {
  const colors = useColors();
  const content = (
    <>
      <Feather name="search" size={19} color={colors.mutedForeground} />
      {onChangeText ? (
        <TextInput value={value} onChangeText={onChangeText} placeholder="Search movies, actors, genres" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} />
      ) : (
        <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>Search movies, actors, genres</Text>
      )}
      <Feather name="sliders" size={17} color={colors.mutedForeground} />
    </>
  );

  if (onPress) {
    return <Pressable testID="home-search" accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.container, { backgroundColor: colors.card, opacity: pressed ? 0.78 : 1 }]}>{content}</Pressable>;
  }
  return <View style={[styles.container, { backgroundColor: colors.card }]}>{content}</View>;
}

function TextInput(props: React.ComponentProps<typeof import('react-native').TextInput>) {
  const NativeTextInput = require('react-native').TextInput as typeof import('react-native').TextInput;
  return <NativeTextInput {...props} />;
}

const styles = StyleSheet.create({
  container: { height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  placeholder: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 0 },
});