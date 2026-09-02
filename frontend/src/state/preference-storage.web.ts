/** Web theme-preference persistence — localStorage. */
const KEY = 'oms_theme_preference';

export async function getStoredPreference(): Promise<string | null> {
  return localStorage.getItem(KEY);
}

export async function setStoredPreference(value: string): Promise<void> {
  localStorage.setItem(KEY, value);
}
