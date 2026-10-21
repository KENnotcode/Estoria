import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppPressable } from '@/components/AppPressable';
import { useAuth } from '@/context/AuthContext';
import { border, radius, spacing, surface, type } from '@/constants/theme';
import { FAVORITE_GENRE_OPTIONS } from '@/constants/genres';
import { useColors } from '@/hooks/useColors';

/**
 * Preferences bottom sheet opened from the Profile screen's Preferences row.
 * Same look as the post-signup setup sheet, but only edits the member's
 * favorite genres. Changes persist through AuthContext.updateProfile.
 */

type PreferencesModalProps = {
  /** Whether the sheet is visible. */
  visible: boolean;
  /** Called when the user closes the sheet (close button, backdrop, Android back). */
  onDismiss: () => void;
};

const sameSelection = (a: string[], b: string[]) =>
  a.length === b.length && a.every((genre) => b.includes(genre));

export function PreferencesModal({ visible, onDismiss }: PreferencesModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { account, updateProfile } = useAuth();

  const savedGenres = account?.favoriteGenres ?? [];
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(savedGenres);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasChanges = !sameSelection(favoriteGenres, savedGenres);

  const toggleGenre = useCallback((genre: string) => {
    setFavoriteGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
    );
  }, []);

  const submit = useCallback(async () => {
    if (submitting || !hasChanges || !account) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateProfile({ favoriteGenres });
      onDismiss();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [account, favoriteGenres, hasChanges, onDismiss, submitting, updateProfile]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close preferences"
          onPress={onDismiss}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetHost}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: border.strong }]} />

            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={[styles.kicker, { color: colors.primary }]}>PREFERENCES</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Your tastes</Text>
              </View>
              <AppPressable
                accessibilityLabel="Close preferences"
                onPress={onDismiss}
                accentColor={colors.primary}
                hitSlop={8}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </AppPressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  FAVORITE GENRES
                </Text>
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                  Optional — pick as many as you love.
                </Text>
                <View style={styles.chips}>
                  {FAVORITE_GENRE_OPTIONS.map((genre) => {
                    const isSelected = favoriteGenres.includes(genre);
                    return (
                      <AppPressable
                        key={genre}
                        accessibilityRole="tab"
                        accessibilityLabel={genre}
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => toggleGenre(genre)}
                        accentColor={colors.primary}
                        hitSlop={4}
                        testID={`preferences-genre-${genre}`}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primary : surface.sunken,
                            borderColor: isSelected ? colors.primary : border.hairline,
                          },
                        ]}
                        pressedStyle={styles.chipPressed}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
                          ]}
                        >
                          {genre}
                        </Text>
                      </AppPressable>
                    );
                  })}
                </View>
              </View>

              {submitError ? (
                <View
                  style={[
                    styles.errorBox,
                    { backgroundColor: surface.sunken, borderColor: colors.primary },
                  ]}
                >
                  <Feather name="alert-circle" size={16} color={colors.primary} />
                  <Text style={[styles.errorText, { color: colors.foreground }]}>{submitError}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: border.hairline }]}>
              <AppPressable
                testID="preferences-save"
                accessibilityLabel="Save preferences"
                disabled={!hasChanges || submitting}
                loading={submitting}
                onPress={submit}
                accentColor={colors.primary}
                style={[styles.submit, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                  Save preferences
                </Text>
              </AppPressable>
              <AppPressable
                accessibilityLabel="Cancel"
                onPress={onDismiss}
                accentColor={colors.primary}
                hitSlop={8}
                style={styles.later}
              >
                <Text style={[styles.laterText, { color: colors.mutedForeground }]}>Cancel</Text>
              </AppPressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetHost: {
    width: '100%',
  },
  sheet: {
    width: '100%',
    maxHeight: '86%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  kicker: { ...type.kicker },
  title: { ...type.pageTitle },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  label: { ...type.label },
  hint: { ...type.caption },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 1,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipPressed: { opacity: 0.85 },
  chipLabel: { ...type.label },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: { ...type.subtitle, flex: 1 },
  footer: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  submit: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { ...type.button, fontSize: 14 },
  later: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  laterText: { ...type.label },
});
