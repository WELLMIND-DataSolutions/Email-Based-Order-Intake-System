/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useSyncExternalStore } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPreference, setPreference, subscribe, ThemePreference } from '@/state/theme-preference';

/** 'system' (default) follows the device/browser setting; 'light'/'dark' overrides it. */
export function useThemePreference(): [ThemePreference, (next: ThemePreference) => void] {
  const preference = useSyncExternalStore(subscribe, getPreference, () => 'system' as ThemePreference);
  return [preference, setPreference];
}

export function useResolvedScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const preference = useSyncExternalStore(subscribe, getPreference, () => 'system' as ThemePreference);

  if (preference !== 'system') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useResolvedScheme();
  return Colors[scheme];
}
