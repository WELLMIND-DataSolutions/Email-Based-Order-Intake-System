/** Native (Android/iOS) theme-preference persistence — same split as token-storage.ts. */
import * as SecureStore from 'expo-secure-store';

const KEY = 'oms_theme_preference';

export async function getStoredPreference(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setStoredPreference(value: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, value);
}
