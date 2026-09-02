import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { API_BASE_URL } from '@/api/config';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HoverPressable } from '@/components/ui/hover-pressable';
import { CardShadow, MaxContentWidth, Radii, Spacing, TabBarInset } from '@/constants/theme';
import { useTheme, useThemePreference } from '@/hooks/use-theme';
import { useAuth } from '@/state/auth-context';
import { ThemePreference } from '@/state/theme-preference';

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function Section({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18)}
      style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={[styles.card, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {children}
      </View>
    </Animated.View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small">{label}</ThemedText>
      {children}
    </View>
  );
}

/** Notification toggles are still local-only; Gmail connection arrives in Phase 6. */
export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const [themePreference, setThemePreference] = useThemePreference();
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifyLowConfidence, setNotifyLowConfidence] = useState(true);
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);

  const handleLogout = () => {
    auth.logout();
    router.replace('/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Account">
          <Row label="Signed in">
            <Pressable onPress={handleLogout}>
              <ThemedText type="smallBold" themeColor="danger">
                Log out
              </ThemedText>
            </Pressable>
          </Row>
        </Section>

        <Section title="Appearance" delay={80}>
          <Row label="Theme">
            <View style={styles.segmentRow}>
              {APPEARANCE_OPTIONS.map((opt) => {
                const active = themePreference === opt.value;
                return (
                  <HoverPressable
                    key={opt.value}
                    onPress={() => setThemePreference(opt.value)}
                    lift={0}
                    style={[
                      styles.segmentChip,
                      { backgroundColor: active ? theme.primary : theme.backgroundElement },
                    ]}
                    hoverStyle={!active && { backgroundColor: theme.backgroundSelected }}>
                    <ThemedText
                      type="small"
                      style={{ color: active ? theme.primaryText : theme.textSecondary }}>
                      {opt.label}
                    </ThemedText>
                  </HoverPressable>
                );
              })}
            </View>
          </Row>
        </Section>

        <Section title="Email account" delay={160}>
          <Row label="Gmail">
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
              <ThemedText type="small" themeColor="textSecondary">
                Connected
              </ThemedText>
            </View>
          </Row>
        </Section>

        <Section title="Notifications" delay={240}>
          <Row label="New order emails">
            <Switch value={notifyNewOrders} onValueChange={setNotifyNewOrders} />
          </Row>
          <Row label="Low-confidence extractions">
            <Switch value={notifyLowConfidence} onValueChange={setNotifyLowConfidence} />
          </Row>
        </Section>

        <Section title="Backend" delay={320}>
          <View style={styles.fieldColumn}>
            <ThemedText type="small">API base URL</ThemedText>
            <TextInput
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Set via EXPO_PUBLIC_API_URL — edit here is local-only for now.
            </ThemedText>
          </View>
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    paddingBottom: TabBarInset,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  segmentChip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radii.full,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fieldColumn: {
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
});
