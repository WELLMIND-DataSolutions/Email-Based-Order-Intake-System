/** Web token persistence — localStorage (SecureStore has no web backing). */
const KEY = 'oms_auth_token';

export async function getStoredToken(): Promise<string | null> {
  return localStorage.getItem(KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) {
    localStorage.setItem(KEY, token);
  } else {
    localStorage.removeItem(KEY);
  }
}
