import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, SplitBreakpoint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  left: ReactNode;
  right: ReactNode;
  leftLabel: string;
  rightLabel: string;
};

/**
 * Side-by-side panes on wide screens (≥768px); on narrow screens collapses
 * to a two-tab switcher (Original / Extracted).
 */
export function SplitView({ left, right, leftLabel, rightLabel }: Props) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const [activePane, setActivePane] = useState<'left' | 'right'>('right');

  if (width >= SplitBreakpoint) {
    return (
      <View style={styles.wideContainer}>
        <View style={[styles.pane, { borderRightWidth: 1, borderRightColor: theme.border }]}>
          {left}
        </View>
        <View style={styles.pane}>{right}</View>
      </View>
    );
  }

  return (
    <View style={styles.narrowContainer}>
      <View style={[styles.switcher, { backgroundColor: theme.backgroundElement }]}>
        {(['left', 'right'] as const).map((pane) => {
          const active = activePane === pane;
          return (
            <Pressable
              key={pane}
              onPress={() => setActivePane(pane)}
              style={[styles.switchButton, active && { backgroundColor: theme.card }]}>
              <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
                {pane === 'left' ? leftLabel : rightLabel}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.pane}>{activePane === 'left' ? left : right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wideContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  narrowContainer: {
    flex: 1,
  },
  pane: {
    flex: 1,
  },
  switcher: {
    flexDirection: 'row',
    margin: Spacing.two,
    borderRadius: Spacing.two,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  switchButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two - 2,
  },
});
