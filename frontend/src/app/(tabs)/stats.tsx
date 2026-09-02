import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CardShadow,
  ChartColors,
  MaxContentWidth,
  Radii,
  Spacing,
  TabBarInset,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEmails } from '@/hooks/use-orders';
import { useTheme } from '@/hooks/use-theme';
import { EmailLabel } from '@/types/oms';

type IconName = keyof typeof Ionicons.glyphMap;

// Fixed order — colors follow the label, never the rank (dataviz rule).
const LABELS: EmailLabel[] = ['Order', 'Inquiry', 'Support', 'Spam'];
const LABEL_ICONS: Record<EmailLabel, IconName> = {
  Order: 'cart',
  Inquiry: 'help-circle',
  Support: 'build',
  Spam: 'ban',
};

function StatTile({
  value,
  label,
  icon,
  color,
  bg,
  delay,
}: {
  value: string | number;
  label: string;
  icon: IconName;
  color: string;
  bg: string;
  delay: number;
}) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18)}
      style={[styles.tile, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.tileIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <ThemedText type="subtitle">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Animated.View>
  );
}

export default function StatsScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const chartColors = ChartColors[scheme === 'dark' ? 'dark' : 'light'];
  const { emails, loading } = useEmails();

  const stats = useMemo(() => {
    if (!emails) return null;
    const orders = emails.filter((e) => e.classification.predicted_label === 'Order');
    const counts = Object.fromEntries(
      LABELS.map((l) => [l, emails.filter((e) => e.classification.predicted_label === l).length])
    ) as Record<EmailLabel, number>;
    const avgConfidence =
      emails.reduce((s, e) => s + e.classification.confidence, 0) / (emails.length || 1);
    const romanUrdu = emails.filter((e) => e.extraction?.was_roman_urdu).length;
    return {
      total: emails.length,
      pending: orders.filter((e) => e.status === 'pending_review').length,
      approved: orders.filter((e) => e.status === 'approved').length,
      counts,
      maxCount: Math.max(1, ...Object.values(counts)),
      avgConfidence,
      romanUrdu,
    };
  }, [emails]);

  if (loading || !stats) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingTop: Spacing.three, gap: Spacing.three }]}>
          <Skeleton style={{ height: 90 }} />
          <Skeleton style={{ height: 220 }} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.tileRow}>
            <StatTile
              value={stats.total}
              label="Emails ingested"
              icon="mail"
              color={theme.primary}
              bg={theme.backgroundElement}
              delay={0}
            />
            <StatTile
              value={stats.pending}
              label="Pending review"
              icon="time"
              color={theme.warning}
              bg={theme.warningBg}
              delay={60}
            />
            <StatTile
              value={stats.approved}
              label="Approved"
              icon="checkmark-done"
              color={theme.success}
              bg={theme.successBg}
              delay={120}
            />
            <StatTile
              value={stats.romanUrdu}
              label="Roman Urdu"
              icon="language"
              color={theme.accent}
              bg={theme.accentBg}
              delay={180}
            />
          </View>

          <Animated.View
            entering={FadeInDown.delay(240).springify().damping(18)}
            style={[styles.card, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="smallBold">Classification breakdown</ThemedText>
            <View style={styles.barList}>
              {LABELS.map((label) => {
                const count = stats.counts[label];
                const widthPct = (count / stats.maxCount) * 100;
                return (
                  <View key={label} style={styles.barRow}>
                    <View style={styles.barLabel}>
                      <View style={styles.barLabelLeft}>
                        <Ionicons name={LABEL_ICONS[label]} size={13} color={chartColors[label]} />
                        <ThemedText type="small">{label}</ThemedText>
                      </View>
                      <ThemedText type="smallBold">{count}</ThemedText>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${widthPct}%`, backgroundColor: chartColors[label] },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(320).springify().damping(18)}
            style={[styles.card, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.confidenceHeader}>
              <ThemedText type="smallBold">Average classification confidence</ThemedText>
              <ThemedText type="subtitle">{Math.round(stats.avgConfidence * 100)}%</ThemedText>
            </View>
            <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${stats.avgConfidence * 100}%`, backgroundColor: theme.primary },
                ]}
              />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              The adaptive threshold (blueprint Feature 2) will tune the review rate against this
              once the live pipeline is connected.
            </ThemedText>
          </Animated.View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  scroll: {
    width: '100%',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    paddingBottom: TabBarInset,
    gap: Spacing.three,
  },
  tileRow: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    flexWrap: 'wrap',
  },
  tile: {
    flexGrow: 1,
    flexBasis: 150,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  barList: {
    gap: Spacing.two + 2,
  },
  barRow: {
    gap: Spacing.one,
  },
  barLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  barTrack: {
    height: 10,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radii.sm,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
