/**
 * Native (Android/iOS) token persistence. Platform-split from
 * token-storage.web.ts the same way hooks/use-color-scheme.web.ts splits
 * from its native counterpart — Metro picks the right file per platform.
 */
import * as SecureStore from 'expo-secure-store';

const KEY = 'oms_auth_token';

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(KEY, token);
  } else {
    await SecureStore.deleteItemAsync(KEY);
  }
}
