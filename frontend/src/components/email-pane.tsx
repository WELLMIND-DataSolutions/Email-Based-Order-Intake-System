import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ConfidenceBadge, LabelPill } from '@/components/badges';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Attachment, EmailMessage } from '@/types/oms';

function AttachmentCard({ attachment }: { attachment: Attachment }) {
  const theme = useTheme();

  return (
    <View style={[styles.attachment, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {attachment.kind === 'image' && attachment.source ? (
        <Image source={attachment.source} style={styles.attachmentImage} contentFit="contain" />
      ) : (
        <View style={styles.pdfPlaceholder}>
          <Ionicons name="document-text" size={36} color={theme.danger} />
        </View>
      )}
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {attachment.filename}
      </ThemedText>
    </View>
  );
}

/** Left pane: the original email exactly as received, plus its attachments. */
export function EmailPane({ email }: { email: EmailMessage }) {
  const theme = useTheme();
  const received = new Date(email.received_at).toLocaleString();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View
        entering={FadeInDown.springify().damping(18)}
        style={[styles.headerCard, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText type="smallBold">{email.subject}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          From: {email.sender} &lt;{email.sender_email}&gt;
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Received: {received}
        </ThemedText>
        <View style={styles.badgeRow}>
          <LabelPill label={email.classification.predicted_label} />
          <ConfidenceBadge score={email.classification.confidence} />
        </View>
      </Animated.View>

      <ThemedText type="small" style={styles.body}>
        {email.body_text}
      </ThemedText>

      {email.attachments.length > 0 && (
        <View style={styles.attachmentsSection}>
          <ThemedText type="smallBold">Attachments ({email.attachments.length})</ThemedText>
          <View style={styles.attachmentsRow}>
            {email.attachments.map((a) => (
              <AttachmentCard key={a.id} attachment={a} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  body: {
    lineHeight: 22,
  },
  attachmentsSection: {
    gap: Spacing.two,
  },
  attachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  attachment: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
    width: 140,
  },
  attachmentImage: {
    width: '100%',
    height: 90,
    borderRadius: Spacing.one,
  },
  pdfPlaceholder: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
