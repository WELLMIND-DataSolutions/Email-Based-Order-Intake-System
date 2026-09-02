import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AccentGradient, CardShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_CONFIG: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Inbox', icon: 'mail-outline', iconActive: 'mail' },
  queue: { label: 'Queue', icon: 'cart-outline', iconActive: 'cart' },
  approved: { label: 'Approved', icon: 'checkmark-done-outline', iconActive: 'checkmark-done' },
  stats: { label: 'Stats', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  activity: { label: 'Activity', icon: 'receipt-outline', iconActive: 'receipt' },
  settings: { label: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
};

function TabItem({
  focused,
  label,
  icon,
  iconActive,
  onPress,
}: {
  focused: boolean;
  label: string;
  icon: IconName;
  iconActive: IconName;
  onPress: () => void;
}) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    active.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 220 });
  }, [focused, active]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scale: 0.6 + 0.4 * active.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -1.5 * active.value }, { scale: 1 + 0.1 * active.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={styles.tab}>
      {!focused && hovered && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.backgroundSelected, borderRadius: Radii.full },
          ]}
        />
      )}
      <Animated.View style={[StyleSheet.absoluteFill, pillStyle]}>
        <LinearGradient
          colors={[...AccentGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: Radii.full }]}
        />
      </Animated.View>

      <View style={styles.tabInner}>
        <Animated.View style={iconStyle}>
          <Ionicons
            name={focused ? iconActive : icon}
            size={19}
            color={focused ? '#ffffff' : hovered ? theme.text : theme.textSecondary}
          />
        </Animated.View>
        {focused && (
          <Animated.View entering={FadeInDown.duration(160)}>
            <Text style={styles.activeLabel}>{label}</Text>
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

/** Floating pill-style bottom navigation with an animated gradient indicator. */
export function AppTabBar({ state, navigation }: any) {
  const theme = useTheme();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.bar, CardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? {
            label: route.name,
            icon: 'ellipse-outline' as IconName,
            iconActive: 'ellipse' as IconName,
          };
          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={config.label}
              icon={config.icon}
              iconActive={config.iconActive}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: Spacing.three,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radii.full,
    padding: Spacing.one + 1,
  },
  tab: {
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two + 2,
  },
  activeLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
