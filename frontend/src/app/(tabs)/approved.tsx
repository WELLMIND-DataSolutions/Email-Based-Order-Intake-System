import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmailRow } from '@/components/email-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/ui/skeleton';
import { AccentGradient, CardShadow, MaxContentWidth, Radii, Spacing, TabBarInset } from '@/constants/theme';
import { useEmails } from '@/hooks/use-orders';
import { useTheme } from '@/hooks/use-theme';

function LoadingList() {
  return (
    <View style={styles.list}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton style={styles.skeletonAvatar} />
          <View style={styles.skeletonBody}>
            <Skeleton style={styles.skeletonLineWide} />
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Orders that have been approved — a dedicated history view separate from
 * the Queue (still-pending) and Inbox (everything, filterable by label). */
export default function ApprovedScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { emails, loading, refreshing, refresh } = useEmails();

  const approved = useMemo(() => {
    if (!emails) return [];
    return emails
      .filter((e) => e.classification.predicted_label === 'Order' && e.status === 'approved')
      .sort((a, b) => b.received_at.localeCompare(a.received_at)); // most recently approved first
  }, [emails]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Animated.View entering={FadeInDown.springify().damping(18)}>
            <LinearGradient
              colors={[...AccentGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, CardShadow]}>
              <View style={styles.heroIcon}>
                <Ionicons name="checkmark-done" size={22} color="#ffffff" />
              </View>
              <View style={styles.heroText}>
                <ThemedText type="subtitle" style={styles.heroNumber}>
                  {loading ? '…' : approved.length}
                </ThemedText>
                <ThemedText type="small" style={styles.heroLabel}>
                  order{approved.length === 1 ? '' : 's'} approved
                </ThemedText>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {loading ? (
          <LoadingList />
        ) : (
          <FlatList
            data={approved}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <EmailRow
                item={item}
                index={index}
                onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.id } })}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="checkmark-done-circle-outline" size={44} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  No orders approved yet.
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
  headerBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radii.lg,
    padding: Spacing.three,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    flex: 1,
    flexWrap: 'wrap',
  },
  heroNumber: {
    color: '#ffffff',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.9)',
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: TabBarInset,
    gap: Spacing.two + 2,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  skeletonBody: {
    flex: 1,
    gap: Spacing.two,
  },
  skeletonLineWide: {
    height: 14,
    width: '70%',
  },
  skeletonLine: {
    height: 12,
    width: '90%',
  },
  skeletonLineShort: {
    height: 12,
    width: '40%',
  },
});
