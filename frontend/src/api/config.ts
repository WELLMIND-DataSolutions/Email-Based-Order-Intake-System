/**
 * Backend base URL. Override with EXPO_PUBLIC_API_URL in .env (Expo inlines
 * EXPO_PUBLIC_* vars at build time) — needed when testing on a physical
 * phone, since `localhost` there means the phone itself, not the dev PC.
 * Use the PC's LAN IP instead, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.x:8000
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
