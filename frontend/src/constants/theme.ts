/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    card: '#ffffff',
    border: '#E0E1E6',
    primary: '#3c87f7',
    primaryText: '#ffffff',
    success: '#1a7f37',
    successBg: '#dafbe1',
    warning: '#9a6700',
    warningBg: '#fff8c5',
    danger: '#cf222e',
    dangerBg: '#ffebe9',
    accent: '#7c5cfc',
    accentBg: '#ede9fe',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    card: '#141517',
    border: '#2E3135',
    primary: '#3c87f7',
    primaryText: '#ffffff',
    success: '#3fb950',
    successBg: '#12261e',
    warning: '#d29922',
    warningBg: '#272115',
    danger: '#f85149',
    dangerBg: '#2d1517',
    accent: '#9d8cff',
    accentBg: '#2e2249',
  },
} as const;

/** Signature blue→violet pair used by the tab pill and hero banner. */
export const AccentGradient = ['#3c87f7', '#7c5cfc'] as const;

/** Bottom padding scrollable screens need so the floating tab bar never covers content. */
export const TabBarInset = 96;

/** Below this width the split view collapses to a tab switcher. */
export const SplitBreakpoint = 768;

/**
 * Chart palette (validated with dataviz six-checks per mode).
 * Fixed label order — never reassign colors when filtering.
 */
export const ChartColors = {
  light: { Order: '#1a7f37', Inquiry: '#3c87f7', Support: '#9a6700', Spam: '#cf222e' },
  dark: { Order: '#2ea043', Inquiry: '#3c87f7', Support: '#bf8700', Spam: '#f85149' },
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/** Soft card elevation; on web react-native-web maps these to box-shadow. */
export const CardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const;

export const HoverShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.14,
  shadowRadius: 20,
  elevation: 8,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
