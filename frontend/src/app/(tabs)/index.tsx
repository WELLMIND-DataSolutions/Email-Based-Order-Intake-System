import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmailRow } from '@/components/email-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HoverPressable } from '@/components/ui/hover-pressable';
import { Skeleton } from '@/components/ui/skeleton';
import { AccentGradient, CardShadow, MaxContentWidth, Radii, Spacing, TabBarInset } from '@/constants/theme';
import { useEmails } from '@/hooks/use-orders';
import { useTheme } from '@/hooks/use-theme';
import { EmailLabel } from '@/types/oms';

const FILTERS: ('All' | EmailLabel)[] = ['All', 'Order', 'Inquiry', 'Support', 'Spam'];

function LoadingList() {
  return (
    <View style={styles.list}>
      {[0, 1, 2, 3].map((i) => (
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

export default function InboxScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { emails, loading, refreshing, refresh } = useEmails();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!emails) return [];
    let list = filter === 'All' ? emails : emails.filter((e) => e.classification.predicted_label === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.sender.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.body_text.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.received_at.localeCompare(a.received_at));
  }, [emails, filter, query]);

  const pendingOrders = useMemo(
    () =>
      (emails ?? []).filter(
        (e) => e.classification.predicted_label === 'Order' && e.status === 'pending_review'
      ).length,
    [emails]
  );

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
                <Ionicons name="mail-unread" size={22} color="#ffffff" />
              </View>
              <View style={styles.heroText}>
                <ThemedText type="subtitle" style={styles.heroNumber}>
                  {loading ? '…' : pendingOrders}
                </ThemedText>
                <ThemedText type="small" style={styles.heroLabel}>
                  order{pendingOrders === 1 ? '' : 's'} waiting for review
                </ThemedText>
              </View>
            </LinearGradient>
          </Animated.View>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Ionicons name="search" size={16} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search sender, subject, text…"
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {query.length > 0 && (
              <HoverPressable lift={0} onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
              </HoverPressable>
            )}
          </View>

          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = f === filter;
              return (
                <HoverPressable
                  key={f}
                  onPress={() => setFilter(f)}
                  lift={1}
                  style={[
                    styles.filterChip,
                    { backgroundColor: active ? theme.primary : theme.backgroundElement },
                  ]}
                  hoverStyle={!active && { backgroundColor: theme.backgroundSelected }}>
                  <ThemedText
                    type="small"
                    style={{ color: active ? theme.primaryText : theme.textSecondary }}>
                    {f}
                  </ThemedText>
                </HoverPressable>
              );
            })}
          </View>
        </View>

        {loading ? (
          <LoadingList />
        ) : (
          <FlatList
            data={filtered}
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
                <Ionicons name="mail-open-outline" size={44} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  No matching emails.
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.two + 2,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    paddingBottom: Spacing.one,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radii.full,
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
