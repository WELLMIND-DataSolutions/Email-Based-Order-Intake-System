/**
 * Manual light/dark override, independent of the device's system setting.
 * Same module + pub-sub shape as state/auth.ts, so hooks/use-theme.ts can
 * read it with useSyncExternalStore.
 */
import { getStoredPreference, setStoredPreference } from '@/state/preference-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

let preference: ThemePreference = 'system';
const listeners = new Set<() => void>();

export function getPreference(): ThemePreference {
  return preference;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPreference(next: ThemePreference): void {
  preference = next;
  setStoredPreference(next).catch(() => {
    // best-effort persistence; in-memory preference still works for this session
  });
  listeners.forEach((listener) => listener());
}

/** Loads the persisted preference once at app startup. */
export async function hydratePreference(): Promise<void> {
  const stored = await getStoredPreference();
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    preference = stored;
    listeners.forEach((listener) => listener());
  }
}
