import { ReactNode, useCallback, useState } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode | ((hovered: boolean) => ReactNode);
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Style merged in while the pointer hovers (web) — e.g. a deeper shadow. */
  hoverStyle?: StyleProp<ViewStyle>;
  /** Upward lift in px on hover. Default 2. */
  lift?: number;
  /** Scale while pressed. Default 0.98. */
  pressScale?: number;
};

/**
 * Pressable with spring hover-lift (web) and press-scale (all platforms) —
 * the one interaction primitive every card and button builds on.
 */
export function HoverPressable({
  children,
  onPress,
  disabled,
  style,
  hoverStyle,
  lift = 2,
  pressScale = 0.98,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const hovered = useSharedValue(0);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: hovered.value * -lift },
      { scale: 1 - pressed.value * (1 - pressScale) },
    ],
  }));

  const onHoverIn = useCallback(() => {
    setIsHovered(true);
    hovered.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [hovered]);
  const onHoverOut = useCallback(() => {
    setIsHovered(false);
    hovered.value = withSpring(0, { damping: 20, stiffness: 300 });
  }, [hovered]);
  const onPressIn = useCallback(() => {
    pressed.value = withTiming(1, { duration: 80 });
  }, [pressed]);
  const onPressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: 120 });
  }, [pressed]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <Animated.View style={[style, isHovered && hoverStyle, animatedStyle]}>
        {typeof children === 'function' ? children(isHovered) : children}
      </Animated.View>
    </Pressable>
  );
}
