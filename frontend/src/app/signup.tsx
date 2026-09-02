import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/state/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function SignupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.length >= 3 && password.length >= 6 && confirmPassword.length > 0;

  const handleSubmit = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await auth.signup(username, password);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('That username is already taken');
      } else {
        setError('Could not create account — please try again');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.card, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText type="title" style={styles.title}>
          Sign up
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Create your dashboard account
        </ThemedText>

        <View style={styles.fieldColumn}>
          <ThemedText type="small">Username</ThemedText>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />
          <ThemedText type="small" themeColor="textSecondary">
            At least 3 characters
          </ThemedText>
        </View>

        <View style={styles.fieldColumn}>
          <ThemedText type="small">Password</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />
          <ThemedText type="small" themeColor="textSecondary">
            At least 6 characters
          </ThemedText>
        </View>

        <View style={styles.fieldColumn}>
          <ThemedText type="small">Confirm password</ThemedText>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={handleSubmit}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />
        </View>

        {error && (
          <ThemedText type="small" themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !canSubmit}
          style={[styles.button, { backgroundColor: theme.primary, opacity: submitting || !canSubmit ? 0.6 : 1 }]}>
          {submitting ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <ThemedText type="smallBold" themeColor="primaryText">
              Create account
            </ThemedText>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/login')} style={styles.linkRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Already have an account?{' '}
          </ThemedText>
          <ThemedText type="small" themeColor="primary">
            Log in
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: -Spacing.two,
  },
  fieldColumn: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  error: {
    marginTop: -Spacing.two,
  },
  button: {
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -Spacing.one,
  },
});
