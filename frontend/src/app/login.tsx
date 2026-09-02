import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/state/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await auth.login(username, password);
      router.replace('/(tabs)');
    } catch {
      setError('Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.card, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText type="title" style={styles.title}>
          Sign in
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          AI Email Order Intake dashboard
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
        </View>

        <View style={styles.fieldColumn}>
          <ThemedText type="small">Password</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
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
          disabled={submitting || !username || !password}
          style={[styles.button, { backgroundColor: theme.primary, opacity: submitting || !username || !password ? 0.6 : 1 }]}>
          {submitting ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <ThemedText type="smallBold" themeColor="primaryText">
              Log in
            </ThemedText>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/signup')} style={styles.linkRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Don&apos;t have an account?{' '}
          </ThemedText>
          <ThemedText type="small" themeColor="primary">
            Sign up
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
