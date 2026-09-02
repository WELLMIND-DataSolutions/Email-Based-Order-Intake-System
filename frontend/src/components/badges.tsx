import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EmailLabel, ReviewStatus } from '@/types/oms';

type IconName = keyof typeof Ionicons.glyphMap;

/** Green ≥0.85, yellow ≥0.6, red below — the traffic-light confidence scale. */
export function confidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

export function ConfidenceBadge({ score }: { score: number }) {
  const theme = useTheme();
  const level = confidenceLevel(score);
  const color = level === 'high' ? theme.success : level === 'medium' ? theme.warning : theme.danger;
  const bg = level === 'high' ? theme.successBg : level === 'medium' ? theme.warningBg : theme.dangerBg;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{Math.round(score * 100)}%</Text>
    </View>
  );
}

const LABEL_ICONS: Record<EmailLabel, IconName> = {
  Order: 'cart',
  Inquiry: 'help-circle',
  Support: 'build',
  Spam: 'ban',
};

export function LabelPill({ label }: { label: EmailLabel }) {
  const theme = useTheme();
  const palette: Record<EmailLabel, { color: string; bg: string }> = {
    Order: { color: theme.success, bg: theme.successBg },
    Inquiry: { color: theme.primary, bg: theme.backgroundElement },
    Support: { color: theme.warning, bg: theme.warningBg },
    Spam: { color: theme.danger, bg: theme.dangerBg },
  };
  const { color, bg } = palette[label];

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Ionicons name={LABEL_ICONS[label]} size={11} color={color} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const STATUS_META: Record<ReviewStatus, { text: string; icon: IconName }> = {
  pending_review: { text: 'Pending review', icon: 'time' },
  approved: { text: 'Approved', icon: 'checkmark-circle' },
  rejected: { text: 'Rejected', icon: 'close-circle' },
};

export function StatusPill({ status }: { status: ReviewStatus }) {
  const theme = useTheme();
  const color =
    status === 'approved' ? theme.success : status === 'rejected' ? theme.danger : theme.textSecondary;
  const meta = STATUS_META[status];

  return (
    <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
      <Ionicons name={meta.icon} size={11} color={color} />
      <Text style={[styles.pillText, { color }]}>{meta.text}</Text>
    </View>
  );
}

/** Marks extractions that went through the Roman Urdu few-shot path. */
export function RomanUrduBadge() {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.accentBg }]}>
      <Ionicons name="language" size={11} color={theme.accent} />
      <Text style={[styles.pillText, { color: theme.accent }]}>Roman Urdu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
