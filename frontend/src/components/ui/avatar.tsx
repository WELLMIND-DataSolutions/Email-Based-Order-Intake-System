import { StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Muted two-tone pairs (bg/fg) per scheme; index chosen by name hash so a
// sender keeps their color everywhere.
const PALETTE = {
  light: [
    { bg: '#dbeafe', fg: '#1d4ed8' },
    { bg: '#dcfce7', fg: '#15803d' },
    { bg: '#fef3c7', fg: '#b45309' },
    { bg: '#fce7f3', fg: '#be185d' },
    { bg: '#ede9fe', fg: '#6d28d9' },
    { bg: '#cffafe', fg: '#0e7490' },
  ],
  dark: [
    { bg: '#1e3a5f', fg: '#93c5fd' },
    { bg: '#14352a', fg: '#86efac' },
    { bg: '#3b2f11', fg: '#fcd34d' },
    { bg: '#3d1a2e', fg: '#f9a8d4' },
    { bg: '#2e2249', fg: '#c4b5fd' },
    { bg: '#123a42', fg: '#67e8f9' },
  ],
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const scheme = useColorScheme();
  const colors = PALETTE[scheme === 'dark' ? 'dark' : 'light'];
  const { bg, fg } = colors[hash(name) % colors.length];

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}>
      <Text style={[styles.text, { color: fg, fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
});
