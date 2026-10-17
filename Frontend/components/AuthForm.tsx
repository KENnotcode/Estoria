import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ImageBackground,
  Image,
  KeyboardAvoidingView,
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
import { useTrendingMovies } from '@/hooks/useMovies';

type AuthFormProps = { mode: 'login' | 'signup' };

type FieldName = 'name' | 'email' | 'password';
type FieldValues = { name: string; email: string; password: string };
type FormErrors = Partial<Record<FieldName | 'form', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Used while the live backdrop is still loading or offline. */
const FALLBACK_BACKDROP = require('@/assets/images/hero-orbit.jpg');

/**
 * Picks one film per day from the live trending list. Stable within a day so
 * the artwork does not churn between renders, different across days.
 */
function dailyIndex(length: number): number {
  if (length < 1) return 0;
  return Math.floor(Date.now() / 86_400_000) % length;
}

export function AuthForm({ mode }: AuthFormProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const { data: trending = [] } = useTrendingMovies();
  const isSignup = mode === 'signup';
  const isIOS = Platform.OS === 'ios';

  const [values, setValues] = useState<FieldValues>({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  const backdropMovie = trending.length > 0 ? trending[dailyIndex(trending.length)] : undefined;
  const canGoBack = router.canGoBack();

  const fieldError = (field: FieldName, next: FieldValues): string | undefined => {
    if (field === 'name') {
      if (!isSignup) return undefined;
      const length = next.name.trim().length;
      if (length < 2) return 'Enter your name.';
      if (length > 50) return 'Your name must be 50 characters or fewer.';
      return undefined;
    }
    if (field === 'email') {
      return EMAIL_PATTERN.test(next.email.trim()) ? undefined : 'Enter a valid email address.';
    }
    return next.password.length >= 6 ? undefined : 'Password needs at least 6 characters.';
  };

  const updateField = (field: FieldName, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Errors only appear once a field has been visited, so typing a fresh
    // email never starts the screen in a red state.
    if (touched[field]) {
      setErrors((current) => ({ ...current, [field]: fieldError(field, next) }));
    }
  };

  const blurField = (field: FieldName) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: fieldError(field, values) }));
  };

  const submit = async () => {
    const nextErrors: FormErrors = {};
    const fields: FieldName[] = isSignup ? ['name', 'email', 'password'] : ['email', 'password'];
    for (const field of fields) {
      const message = fieldError(field, values);
      if (message) nextErrors[field] = message;
    }

    if (Object.keys(nextErrors).length > 0) {
      setTouched({ name: true, email: true, password: true });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (isSignup) await signUp(values.name.trim(), values.email.trim(), values.password);
      else await signIn(values.email.trim(), values.password);
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openReset = () => {
    setResetEmail(values.email.trim());
    setResetError('');
    setResetSent(false);
    setResetOpen(true);
  };

  const closeReset = () => {
    setResetOpen(false);
    setResetError('');
    setResetSent(false);
  };

  const submitReset = async () => {
    const address = resetEmail.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setResetError('Enter a valid email address.');
      return;
    }

    setResetError('');
    setResetting(true);
    try {
      await sendPasswordReset(address);
      setResetSent(true);
    } catch (error) {
      setResetError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={isIOS ? 'padding' : undefined}
    >
      <View style={styles.backdropLayer} pointerEvents="none">
        <ImageBackground
          source={backdropMovie?.backdrop ?? FALLBACK_BACKDROP}
          resizeMode="cover"
          style={styles.backdrop}
        >
          <LinearGradient
            colors={['rgba(12, 13, 16, 0.66)', 'rgba(12, 13, 16, 0.4)', colors.background]}
            locations={[0, 0.42, 0.94]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            flexGrow: 1,
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing['2xl'],
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {canGoBack ? (
          <AppPressable
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={6}
            accentColor={colors.primary}
            style={[styles.backButton, { backgroundColor: 'rgba(12, 13, 16, 0.55)', borderColor: border.hairline }]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </AppPressable>
        ) : null}

        <View style={styles.brandRow}>
          <View style={[styles.mark, { backgroundColor: 'transparent' }]}>
            <Image source={require('../assets/images/EstoriaIconTransparent.png')} style={styles.markImage} />
          </View>
          <Text style={[styles.brandWord, { color: colors.foreground }]}>Estoria</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          {isSignup ? 'Make room for more stories.' : 'Welcome back.'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isSignup
            ? 'Save the films that stay with you and find them whenever you are ready.'
            : 'Sign in to pick up where your watchlist left off.'}
        </Text>

        <View style={[styles.card, { borderColor: border.hairline }]}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {isIOS ? <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} /> : null}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isIOS ? 'rgba(12, 13, 16, 0.4)' : colors.card },
              ]}
            />
          </View>

          <View style={styles.cardBody}>
            {errors.form ? (
              <View style={[styles.formError, { backgroundColor: surface.sunken }]}>
                <Feather name="alert-circle" size={14} color={colors.primary} />
                <Text style={[styles.formErrorText, { color: colors.foreground }]}>{errors.form}</Text>
              </View>
            ) : null}

            {isSignup ? (
              <AuthInput
                label="Your name"
                value={values.name}
                onChangeText={(value) => updateField('name', value)}
                onBlur={() => blurField('name')}
                error={touched.name ? errors.name : undefined}
                colors={colors}
                placeholder="Carlo"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
            ) : null}

            <AuthInput
              label="Email"
              value={values.email}
              onChangeText={(value) => updateField('email', value)}
              onBlur={() => blurField('email')}
              error={touched.email ? errors.email : undefined}
              colors={colors}
              placeholder="youremail@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <AuthInput
              label="Password"
              value={values.password}
              onChangeText={(value) => updateField('password', value)}
              onBlur={() => blurField('password')}
              error={touched.password ? errors.password : undefined}
              colors={colors}
              placeholder="At least 6 characters"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={isSignup ? 'new-password' : 'password'}
              textContentType={isSignup ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={submit}
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((visible) => !visible)}
                  hitSlop={12}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
                </Pressable>
              }
            />

            {!isSignup ? (
              resetOpen ? (
                <View style={[styles.resetPanel, { backgroundColor: surface.sunken, borderColor: border.hairline }]}>
                  <View style={styles.resetHead}>
                    <Feather name="key" size={14} color={colors.primary} />
                    <Text style={[styles.resetTitle, { color: colors.foreground }]}>Reset your password</Text>
                  </View>
                  <Text style={[styles.resetHint, { color: colors.mutedForeground }]}>
                    We&apos;ll email you a link to choose a new one.
                  </Text>
                  <TextInput
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    placeholder={values.email.trim() || 'you@example.com'}
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.primary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="send"
                    onSubmitEditing={submitReset}
                    style={[styles.resetInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: border.hairline }]}
                  />
                  {resetError ? (
                    <Text style={[styles.fieldError, { color: colors.primary }]}>{resetError}</Text>
                  ) : null}
                  {resetSent ? (
                    <View style={styles.resetDone}>
                      <Feather name="check" size={13} color={colors.primary} />
                      <Text style={[styles.resetDoneText, { color: colors.foreground }]}>
                        Check your inbox for a reset link.
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.resetActions}>
                    <AppPressable
                      accessibilityLabel="Send reset link"
                      loading={resetting}
                      disabled={resetting}
                      onPress={submitReset}
                      accentColor={colors.primary}
                      style={[styles.resetSend, { backgroundColor: colors.primary }]}
                      pressedStyle={styles.pressed}
                    >
                      <Text style={[styles.resetSendText, { color: colors.primaryForeground }]}>
                        Send reset link
                      </Text>
                    </AppPressable>
                    <AppPressable
                      accessibilityLabel="Cancel password reset"
                      onPress={closeReset}
                      accentColor={colors.primary}
                      style={[styles.resetCancel, { borderColor: border.hairline }]}
                      pressedStyle={styles.pressed}
                    >
                      <Text style={[styles.resetCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                    </AppPressable>
                  </View>
                </View>
              ) : (
                <Pressable accessibilityRole="button" onPress={openReset} hitSlop={10} style={styles.forgotHit}>
                  <Text style={[styles.forgotText, { color: colors.mutedForeground }]}>Forgot password?</Text>
                </Pressable>
              )
            ) : null}

            <AppPressable
              accessibilityRole="button"
              accessibilityLabel={isSignup ? 'Create account' : 'Sign in'}
              loading={submitting}
              disabled={submitting}
              onPress={submit}
              accentColor={colors.primary}
              style={[styles.submit, { backgroundColor: colors.primary }]}
              pressedStyle={styles.pressed}
            >
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                {submitting
                  ? isSignup
                    ? 'Creating your account…'
                    : 'Signing you in…'
                  : isSignup
                    ? 'Create account'
                    : 'Sign in'}
              </Text>
              {!submitting ? (
                <Feather name="arrow-up-right" size={17} color={colors.primaryForeground} />
              ) : null}
            </AppPressable>
          </View>
        </View>

        <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
          {isSignup ? 'Already have an account? ' : 'New to Estoria? '}
          <Link
            href={isSignup ? '/login' : '/signup'}
            style={[styles.switchLink, { color: colors.foreground }]}
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </Link>
        </Text>


      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type AuthInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  colors: ReturnType<typeof useColors>;
  /** Adornment rendered inside the input row, e.g. the visibility toggle. */
  right?: ReactNode;
} & Omit<ComponentProps<typeof TextInput>, 'onChangeText' | 'onBlur'>;

function AuthInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  colors,
  right,
  ...inputProps
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.primary : focused ? border.strong : border.hairline,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          style={[styles.input, { color: colors.foreground }]}
          {...inputProps}
        />
        {right}
      </View>
      {error ? <Text style={[styles.fieldError, { color: colors.primary }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backdropLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backdrop: { flex: 1 },
  content: { paddingHorizontal: spacing.screen, maxWidth: 560, width: '100%', alignSelf: 'center' },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['2xl'] },
  mark: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  markImage: { width: 46, height: 46 },
  brandWord: { fontSize: 17, lineHeight: 22, letterSpacing: -0.3, fontFamily: type.cardTitle.fontFamily },
  title: { ...type.pageTitle, fontSize: 32, lineHeight: 38, letterSpacing: -0.9, maxWidth: 330 },
  subtitle: { ...type.body, marginTop: spacing.md, maxWidth: 330 },
  card: {
    marginTop: spacing['2xl'],
    borderRadius: radius.xl + 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardBody: { padding: spacing.xl, gap: spacing.lg },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  formErrorText: { ...type.subtitle, flex: 1 },
  label: { ...type.label, marginBottom: spacing.sm },
  inputBox: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, paddingVertical: spacing.md, ...type.body },
  fieldError: { ...type.caption, marginTop: spacing.xs },
  forgotHit: { alignSelf: 'flex-start', marginTop: -spacing.sm },
  forgotText: { ...type.label },
  submit: { height: 56, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  submitText: { ...type.button, fontSize: 14 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  resetPanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resetTitle: { ...type.label },
  resetHint: { ...type.caption },
  resetInput: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    ...type.body,
  },
  resetDone: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resetDoneText: { ...type.caption, flex: 1 },
  resetActions: { flexDirection: 'row', gap: spacing.md },
  resetSend: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetSendText: { ...type.button },
  resetCancel: {
    height: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetCancelText: { ...type.button },
  switchText: { ...type.body, textAlign: 'center', marginTop: spacing.xl },
  switchLink: { fontFamily: type.button.fontFamily },
  creditWrap: { flex: 1, justifyContent: 'flex-end', paddingTop: spacing['2xl'] },
  creditRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  creditText: { ...type.caption, flexShrink: 1 },
  creditRating: { ...type.meta, fontFamily: type.label.fontFamily },
  numeric: type.numeric,
  creditPressed: { opacity: 0.7 },
});
