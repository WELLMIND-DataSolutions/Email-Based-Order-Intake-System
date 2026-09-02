import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

import { ConfidenceBadge, LabelPill, StatusPill } from '@/components/badges';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { HoverPressable } from '@/components/ui/hover-pressable';
import { CardShadow, HoverShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EmailMessage } from '@/types/oms';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** One row in an email/order list — used by Inbox and Queue. */
export function EmailRow({
  item,
  index,
  onPress,
}: {
  item: EmailMessage;
  index: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const snippet = item.body_text.replace(/\s+/g, ' ').slice(0, 90);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify().damping(18)}>
      <HoverPressable
        onPress={onPress}
        style={[styles.row, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}
        hoverStyle={[HoverShadow, { borderColor: theme.primary }]}>
        <Avatar name={item.sender} size={42} />
        <View style={styles.rowBody}>
          <View style={styles.rowHeader}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.sender}>
              {item.sender}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(item.received_at)}
            </ThemedText>
          </View>

          <ThemedText numberOfLines={1}>{item.subject}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {snippet}
          </ThemedText>

          <View style={styles.badgeRow}>
            <LabelPill label={item.classification.predicted_label} />
            <ConfidenceBadge score={item.classification.confidence} />
            {item.classification.predicted_label === 'Order' && <StatusPill status={item.status} />}
            {item.attachments.length > 0 && (
              <View style={styles.attachmentHint}>
                <Ionicons name="attach" size={13} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  {item.attachments.length}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </HoverPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.three,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sender: {
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
    flexWrap: 'wrap',
  },
  attachmentHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
