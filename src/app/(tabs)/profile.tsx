import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '../../../hooks/useColors';
import { useFavorites } from '../../../context/FavoritesContext';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const rows = [
    { icon: 'bookmark', label: 'Saved movies', value: `${favoriteIds.length}`, action: () => router.push('/favorites') },
    { icon: 'clock', label: 'Watch history', value: '0', action: () => Alert.alert('Watch history', 'Your watch history will appear here after you finish a film.') },
    { icon: 'settings', label: 'Preferences', value: '', action: () => Alert.alert('Preferences', 'Your viewing preferences are set for a quiet, cinematic discovery experience.') },
    { icon: 'info', label: 'About Estoria', value: '', action: () => Alert.alert('Estoria', 'A place to find the stories you want to remember.') },
  ] as const;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <View style={styles.content}>
        <Text style={[styles.kicker, { color: colors.primary }]}>YOUR SPACE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>K</Text></View>
          <View style={styles.profileCopy}><Text style={[styles.name, { color: colors.foreground }]}>Carlo</Text><Text style={[styles.email, { color: colors.mutedForeground }]}>Movie lover · Estoria member</Text></View>
          <Feather name="edit-2" size={16} color={colors.mutedForeground} />
        </View>
        <View style={styles.menu}>
          {rows.map((row) => <Pressable key={row.label} accessibilityRole="button" onPress={row.action} style={({ pressed }) => [styles.menuRow, { borderBottomColor: colors.border, opacity: pressed ? 0.68 : 1 }]}><View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}><Feather name={row.icon} size={17} color={colors.foreground} /></View><Text style={[styles.menuLabel, { color: colors.foreground }]}>{row.label}</Text>{row.value ? <Text style={[styles.menuValue, { color: colors.primary }]}>{row.value}</Text> : null}<Feather name="chevron-right" size={17} color={colors.mutedForeground} /></Pressable>)}
        </View>
        <Pressable accessibilityRole="button" onPress={() => Alert.alert('Sign out', 'You are using a local Estoria profile. There is nothing to sign out of yet.')} style={[styles.logout, { borderColor: colors.border }]}><Feather name="log-out" size={16} color={colors.mutedForeground} /><Text style={[styles.logoutText, { color: colors.mutedForeground }]}>Sign out</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  title: { fontSize: 27, letterSpacing: -0.7, fontFamily: 'Inter_700Bold', marginBottom: 24 },
  profileCard: { borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter_700Bold' },
  profileCopy: { flex: 1, marginLeft: 13 },
  name: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  email: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  menu: { marginTop: 28 },
  menuRow: { minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  menuValue: { fontSize: 13, fontFamily: 'Inter_700Bold', marginRight: 4 },
  logout: { marginTop: 30, height: 48, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  logoutText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});