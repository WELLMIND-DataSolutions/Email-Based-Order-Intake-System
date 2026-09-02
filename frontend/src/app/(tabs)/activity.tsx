import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RomanUrduBadge } from '@/components/badges';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/ui/skeleton';
import { CardShadow, MaxContentWidth, Radii, Spacing, TabBarInset } from '@/constants/theme';
import { useAuditLog } from '@/hooks/use-orders';
import { useTheme } from '@/hooks/use-theme';
import { AuditEntry } from '@/types/oms';

type IconName = keyof typeof Ionicons.glyphMap;

const ACTION_META: Record<AuditEntry['action'], { icon: IconName; text: string }> = {
  field_edited: { icon: 'create', text: 'Field corrected' },
  approved: { icon: 'checkmark-circle', text: 'Order approved' },
  rejected: { icon: 'close-circle', text: 'Order rejected' },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AuditRow({ entry, index }: { entry: AuditEntry; index: number }) {
  const theme = useTheme();
  const meta = ACTION_META[entry.action];
  const actionColor =
    entry.action === 'approved'
      ? theme.success
      : entry.action === 'rejected'
        ? theme.danger
        : theme.primary;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 50).springify().damping(18)}
      style={[styles.row, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowTitle}>
          <Ionicons name={meta.icon} size={15} color={actionColor} />
          <ThemedText type="smallBold">
            {meta.text}
            {entry.field ? `: ${entry.field}` : ''}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(entry.created_at)}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {entry.email_subject}
      </ThemedText>

      {entry.action === 'field_edited' && (
        <View style={styles.diffBlock}>
          <View style={[styles.diffRow, { backgroundColor: theme.dangerBg }]}>
            <ThemedText type="small" style={{ color: theme.danger }} numberOfLines={2}>
              AI: {entry.ai_value}
            </ThemedText>
          </View>
          <View style={[styles.diffRow, { backgroundColor: theme.successBg }]}>
            <ThemedText type="small" style={{ color: theme.success }} numberOfLines={2}>
              Human: {entry.human_value}
            </ThemedText>
          </View>
        </View>
      )}

      {entry.was_roman_urdu && (
        <View style={styles.badgeRow}>
          <RomanUrduBadge />
        </View>
      )}
    </Animated.View>
  );
}

/**
 * The correction log — the training-data source for the active-learning loop
 * (blueprint Unique Feature 3). Every human edit lands here as ai_value vs
 * human_value.
 */
export default function ActivityScreen() {
  const theme = useTheme();
  const { entries } = useAuditLog();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {entries === null ? (
          <View style={styles.list}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 84 }} />
            ))}
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <AuditRow entry={item} index={index} />}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <ThemedText type="small" themeColor="textSecondary" style={styles.header}>
                Every correction becomes training data for the weekly fine-tune (Feature 3).
              </ThemedText>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={44} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  No activity yet — approve or edit an order to see it here.
                </ThemedText>
              </View>
            }
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    marginBottom: Spacing.one,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: TabBarInset,
    gap: Spacing.two + 2,
  },
  row: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.one + 2,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  diffBlock: {
    gap: Spacing.one,
  },
  diffRow: {
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
});
