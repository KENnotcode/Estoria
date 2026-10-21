import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppPressable } from '@/components/AppPressable';
import { useAuth } from '@/context/AuthContext';
import { border, radius, spacing, surface, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

/**
 * Post-signup profile setup bottom sheet (Frontend/basta2.md).
 *
 * Rendered over the landing screen while `account.isProfileComplete` is
 * false. Submitting persists displayName / photoURL / favoriteGenres and
 * flips the flag through AuthContext, which unmounts the sheet — the flag
 * is the only thing that closes it permanently, so it can never reopen
 * once submitted. "Maybe later" only dismisses it for the current session.
 */

type CompleteProfileModalProps = {
  /** Called when the user opts out for this session (close button, backdrop, Android back). */
  onDismiss: () => void;
};

/** Mirrors the repository's display-name rule so the button state matches the write. */
const DISPLAY_NAME_MIN = 1;
const DISPLAY_NAME_MAX = 50;

/**
 * Curated subset of the TMDB genre names. A static list keeps the sheet
 * usable offline right after signup, where a network-backed genre list
 * would leave an empty selector.
 */
const FAVORITE_GENRE_OPTIONS = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
];

export function CompleteProfileModal({ onDismiss }: CompleteProfileModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { account, completeProfile } = useAuth();

  const [displayName, setDisplayName] = useState(account?.name ?? '');
  const [photoURL, setPhotoURL] = useState<string | null>(account?.photoURL ?? null);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(account?.favoriteGenres ?? []);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmedName = displayName.trim();
  const canSubmit =
    trimmedName.length >= DISPLAY_NAME_MIN && trimmedName.length <= DISPLAY_NAME_MAX;
  const avatarLetter = (trimmedName || account?.name || 'E').charAt(0).toUpperCase();

  const toggleGenre = useCallback((genre: string) => {
    setFavoriteGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
    );
  }, []);

  const pickPhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoError('Photo access is off. Allow it in settings to add a picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      const asset = result.canceled ? null : (result.assets[0] ?? null);
      if (asset) {
        setPhotoURL(asset.uri);
        setPhotoError(null);
      }
    } catch {
      setPhotoError('Could not open the photo picker. Please try again.');
    }
  }, []);

  const removePhoto = useCallback(() => {
    setPhotoURL(null);
    setPhotoError(null);
  }, []);

  const submit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await completeProfile({
        displayName: trimmedName,
        photoURL,
        favoriteGenres,
      });
      // The context flips isProfileComplete → the parent unmounts the sheet.
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, completeProfile, favoriteGenres, photoURL, submitting, trimmedName]);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        {/* Backdrop sits behind the sheet; tapping it dismisses for the session. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close profile setup"
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
                <Text style={[styles.kicker, { color: colors.primary }]}>WELCOME TO ESTORIA</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Set up your profile
                </Text>
              </View>
              <AppPressable
                accessibilityLabel="Close profile setup"
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
              <Text style={[styles.intro, { color: colors.mutedForeground }]}>
                Add a name and a photo so your profile feels like yours. You can change these
                anytime.
              </Text>

              <View style={styles.photoRow}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: surface.raised, borderColor: border.hairline },
                  ]}
                >
                  {photoURL ? (
                    <Image source={{ uri: photoURL }} style={styles.avatarImage} />
                  ) : (
                    <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                      {avatarLetter}
                    </Text>
                  )}
                </View>
                <View style={styles.photoControls}>
                  <AppPressable
                    accessibilityLabel={photoURL ? 'Change profile photo' : 'Add profile photo'}
                    onPress={pickPhoto}
                    accentColor={colors.primary}
                    style={[
                      styles.photoButton,
                      { backgroundColor: surface.sunken, borderColor: border.hairline },
                    ]}
                    pressedStyle={styles.chipPressed}
                  >
                    <Feather name="camera" size={15} color={colors.foreground} />
                    <Text style={[styles.photoButtonText, { color: colors.foreground }]}>
                      {photoURL ? 'Change photo' : 'Add photo'}
                    </Text>
                  </AppPressable>
                  {photoURL ? (
                    <AppPressable
                      accessibilityLabel="Remove profile photo"
                      onPress={removePhoto}
                      accentColor={colors.primary}
                      hitSlop={6}
                      style={styles.removePhoto}
                    >
                      <Text style={[styles.removePhotoText, { color: colors.mutedForeground }]}>
                        Remove
                      </Text>
                    </AppPressable>
                  ) : (
                    <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                      Optional — a picture makes your profile yours.
                    </Text>
                  )}
                  {photoError ? (
                    <Text style={[styles.photoError, { color: colors.primary }]}>{photoError}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>DISPLAY NAME</Text>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: surface.sunken, borderColor: border.hairline },
                  ]}
                >
                  <Feather name="user" size={16} color={colors.mutedForeground} />
                  <TextInput
                    testID="complete-profile-name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="How should we call you?"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={DISPLAY_NAME_MAX}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    style={[styles.input, { color: colors.foreground }]}
                  />
                  {trimmedName.length < DISPLAY_NAME_MIN ? (
                    <Text style={[styles.required, { color: colors.primary }]}>Required</Text>
                  ) : null}
                </View>
              </View>

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
                        testID={`complete-profile-genre-${genre}`}
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
                testID="complete-profile-submit"
                accessibilityLabel="Complete profile"
                disabled={!canSubmit}
                loading={submitting}
                onPress={submit}
                accentColor={colors.primary}
                style={[styles.submit, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                  Complete profile
                </Text>
              </AppPressable>
              <AppPressable
                accessibilityLabel="Skip profile setup for now"
                onPress={onDismiss}
                accentColor={colors.primary}
                hitSlop={8}
                style={styles.later}
              >
                <Text style={[styles.laterText, { color: colors.mutedForeground }]}>
                  Maybe later
                </Text>
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
    // Lets the sheet clamp at maxHeight while still scrolling its content.
    flexShrink: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  intro: { ...type.body },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    ...type.pageTitle,
    fontSize: 28,
    lineHeight: 34,
  },
  photoControls: {
    flex: 1,
    gap: spacing.sm,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  photoButtonText: { ...type.label },
  chipPressed: { opacity: 0.85 },
  removePhoto: {
    alignSelf: 'flex-start',
  },
  removePhotoText: { ...type.label },
  hint: { ...type.caption },
  photoError: { ...type.caption },
  section: {
    gap: spacing.sm,
  },
  label: { ...type.label },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    ...type.body,
  },
  required: { ...type.caption },
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
