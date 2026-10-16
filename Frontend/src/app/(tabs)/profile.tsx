import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { radius, spacing, type } from '../../../constants/theme';
import { useColors } from '../../../hooks/useColors';
import { useFavorites } from '../../../context/FavoritesContext';
import { useAuth } from '../../../context/AuthContext';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const { account, signOut } = useAuth();
  const rows = [
    { icon: 'bookmark', label: 'Saved movies', value: `${favoriteIds.length}`, action: () => router.push('/favorites') },
    { icon: 'clock', label: 'Watch history', value: '0', action: () => Alert.alert('Watch history', 'Your watch history will appear here after you finish a film.') },
    { icon: 'settings', label: 'Preferences', value: '', action: () => Alert.alert('Preferences', 'Your viewing preferences are set for a quiet, cinematic discovery experience.') },
    { icon: 'info', label: 'About Estoria', value: '', action: () => Alert.alert('Estoria', 'A place to find the stories you want to remember.') },
  ] as const;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 112 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.kicker, { color: colors.primary }]}>YOUR SPACE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
          {account ? (
            <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                {account.photoURL ? (
                  <Image source={{ uri: account.photoURL }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{account.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.profileCopy}><Text style={[styles.name, { color: colors.foreground }]}>{account.name}</Text><Text style={[styles.email, { color: colors.mutedForeground }]}>{account.email}</Text></View>
              <Feather name="check" size={16} color={colors.primary} />
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={[styles.profileCard, { backgroundColor: colors.card }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Feather name="user" size={22} color="#FFFFFF" /></View>
              <View style={styles.profileCopy}><Text style={[styles.name, { color: colors.foreground }]}>Sign in to Estoria</Text><Text style={[styles.email, { color: colors.mutedForeground }]}>Sync your collection on this device</Text></View>
              <Feather name="arrow-up-right" size={16} color={colors.foreground} />
            </Pressable>
          )}
          <View style={styles.menu}>
            {rows.map((row) => <Pressable key={row.label} accessibilityRole="button" onPress={row.action} style={({ pressed }) => [styles.menuRow, { borderBottomColor: colors.border, opacity: pressed ? 0.68 : 1 }]}><View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}><Feather name={row.icon} size={17} color={colors.foreground} /></View><Text style={[styles.menuLabel, { color: colors.foreground }]}>{row.label}</Text>{row.value ? <Text style={[styles.menuValue, { color: colors.primary }]}>{row.value}</Text> : null}<Feather name="chevron-right" size={17} color={colors.mutedForeground} /></Pressable>)}
          </View>
          {account ? <Pressable accessibilityRole="button" onPress={() => Alert.alert('Sign out', 'Sign out of this device?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => void signOut() }])} style={({ pressed }) => [styles.logout, { borderColor: colors.border }, pressed && styles.pressed]}><Feather name="log-out" size={16} color={colors.mutedForeground} /><Text style={[styles.logoutText, { color: colors.mutedForeground }]}>Sign out</Text></Pressable> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.screen },
  kicker: { ...type.kicker, marginBottom: 6 },
  title: { ...type.pageTitle, marginBottom: spacing.xl },
  profileCard: { borderRadius: radius.lg + 2, padding: spacing.lg - 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: radius.pill },
  avatarText: { color: '#FFFFFF', ...type.hero, fontSize: 22, lineHeight: 28 },
  profileCopy: { flex: 1, marginLeft: spacing.md + 1 },
  name: { ...type.cardTitle, fontSize: 16 },
  email: { ...type.caption, marginTop: 4 },
  menu: { marginTop: spacing.section },
  menuRow: { minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuIcon: { width: 34, height: 34, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, ...type.body },
  menuValue: { ...type.label, marginRight: 4 },
  logout: { marginTop: spacing['2xl'] - 2, height: 48, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  logoutText: { ...type.label },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
});
