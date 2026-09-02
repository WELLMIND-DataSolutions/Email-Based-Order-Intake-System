/**
 * Single source of truth for the auth token, readable/writable from both
 * React components (via auth-context's useSyncExternalStore) and plain
 * async code that isn't a component (api/client.ts's 401 handler).
 */
import { getStoredToken, setStoredToken } from '@/state/token-storage';

let token: string | null = null;
let ready = false; // true once the persisted token has loaded (avoids a login-screen flash on startup)
const listeners = new Set<() => void>();

export function getToken(): string | null {
  return token;
}

export function isReady(): boolean {
  return ready;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setToken(next: string | null): void {
  token = next;
  setStoredToken(next).catch(() => {
    // best-effort persistence; in-memory token still works for this session
  });
  listeners.forEach((listener) => listener());
}

/** Loads the persisted token into memory once at app startup. */
export async function hydrateToken(): Promise<void> {
  token = await getStoredToken();
  ready = true;
  listeners.forEach((listener) => listener());
}
