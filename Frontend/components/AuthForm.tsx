import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { radius, spacing, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type AuthFormProps = { mode: 'login' | 'signup' };

export function AuthForm({ mode }: AuthFormProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    if (isSignup && name.trim().length < 2) {
      setError('Enter your name so your Estoria profile feels like yours.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Your password needs at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) await signUp(name, email, password);
      else await signIn(email, password);
      router.replace('/(tabs)');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Text style={styles.markText}>E</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{isSignup ? 'Make room for more stories.' : 'Welcome back to Estoria.'}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isSignup ? 'Save the films that stay with you and find them whenever you are ready.' : 'Sign in to pick up where your watchlist left off.'}
        </Text>

        <View style={styles.form}>
          {isSignup ? (
            <Field label="Your name" value={name} onChangeText={setName} placeholder="Carlo" colors={colors} autoCapitalize="words" />
          ) : null}
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" colors={colors} keyboardType="email-address" autoCapitalize="none" />
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <View style={[styles.passwordWrap, { backgroundColor: colors.card, borderColor: error ? colors.primary : colors.border }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[styles.input, { color: colors.foreground }]}
              />
              <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword((visible) => !visible)} hitSlop={10}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
          {error ? <Text style={[styles.error, { color: colors.primary }]}>{error}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ busy: submitting }} disabled={submitting} onPress={submit} style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary }, pressed && styles.pressed, submitting && styles.disabled]}>
            <Text style={styles.submitText}>{submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}</Text>
            <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
          {isSignup ? 'Already have an account? ' : 'New to Estoria? '}
          <Link href={isSignup ? '/login' : '/signup'} style={[styles.switchLink, { color: colors.foreground }]}>
            {isSignup ? 'Sign in' : 'Create one'}
          </Link>
        </Text>
        <Text style={[styles.localNote, { color: colors.mutedForeground }]}>Your account is stored securely on this device for this preview.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors> } & ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} style={[styles.inputBox, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.screen },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: spacing.xl },
  mark: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  markText: { color: '#FFFFFF', ...type.hero, fontSize: 25, lineHeight: 30 },
  title: { ...type.hero, fontSize: 34, lineHeight: 38, maxWidth: 330 },
  subtitle: { ...type.body, marginTop: spacing.md, maxWidth: 340 },
  form: { gap: spacing.lg, marginTop: spacing['2xl'] },
  label: { ...type.label, marginBottom: spacing.sm },
  inputBox: { height: 54, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, ...type.body },
  passwordWrap: { minHeight: 54, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 52, padding: 0, ...type.body },
  error: { ...type.subtitle, marginTop: -spacing.sm },
  submit: { height: 56, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  submitText: { ...type.button, color: '#FFFFFF', fontSize: 14 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  switchText: { ...type.body, textAlign: 'center', marginTop: spacing['2xl'] },
  switchLink: { fontFamily: type.button.fontFamily },
  localNote: { ...type.caption, textAlign: 'center', marginTop: spacing.xl },
});
