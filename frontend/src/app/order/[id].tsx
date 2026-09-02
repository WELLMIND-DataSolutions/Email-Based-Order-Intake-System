import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ConfidenceBadge, LabelPill } from '@/components/badges';
import { EmailPane } from '@/components/email-pane';
import { ExtractedFormPane } from '@/components/extracted-form-pane';
import { SplitView } from '@/components/split-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/ui/toast';
import { Spacing } from '@/constants/theme';
import { useApproveOrder, useEmail, useRejectOrder } from '@/hooks/use-orders';
import { useTheme } from '@/hooks/use-theme';
import { ExtractedOrder } from '@/types/oms';

export default function OrderReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { email, loading } = useEmail(id);
  const approveOrder = useApproveOrder();
  const rejectOrder = useRejectOrder();
  const busy = approveOrder.isPending || rejectOrder.isPending;
  const toast = useToast();

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!email) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Email not found.</ThemedText>
      </ThemedView>
    );
  }

  const isOrder = email.classification.predicted_label === 'Order';

  const goBackToInbox = () => {
    // On web, a direct link/refresh into /order/[id] leaves no history entry —
    // router.back() would then silently no-op and strand the user here.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleApprove = async (order: ExtractedOrder) => {
    try {
      await approveOrder.mutateAsync({ id: email.id, extraction: order });
      toast('Order approved and sent to OMS');
      goBackToInbox();
    } catch {
      toast('Failed to approve order', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await rejectOrder.mutateAsync(email.id);
      toast('Order rejected', 'error');
      goBackToInbox();
    } catch {
      toast('Failed to reject order', 'error');
    }
  };

  // Non-orders have nothing to extract — show the email with its classification.
  if (!isOrder) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: email.classification.predicted_label }} />
        <ScrollView>
          <View style={[styles.notice, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.noticeRow}>
              <LabelPill label={email.classification.predicted_label} />
              <ConfidenceBadge score={email.classification.confidence} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              This email was not classified as an order, so there is nothing to extract.
            </ThemedText>
          </View>
          <EmailPane email={email} />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `Review — ${email.sender}` }} />
      <SplitView
        leftLabel="Original"
        rightLabel="Extracted"
        left={<EmailPane email={email} />}
        right={
          <ExtractedFormPane
            email={email}
            onApprove={handleApprove}
            onReject={handleReject}
            busy={busy}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notice: {
    margin: Spacing.three,
    marginBottom: 0,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  noticeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
