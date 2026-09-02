import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { queryClient } from '@/api/query-client';
import { ToastProvider } from '@/components/ui/toast';
import { useResolvedScheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/state/auth-context';
import { hydratePreference } from '@/state/theme-preference';

/** Redirects to /login whenever there's no token, once the persisted token has finished loading. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const pathname = usePathname();

  if (ready && !token && pathname !== '/login' && pathname !== '/signup') {
    return <Redirect href="/login" />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useResolvedScheme();

  useEffect(() => {
    hydratePreference();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <ToastProvider>
            <AuthGate>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="order/[id]" options={{ title: 'Review Order' }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
              </Stack>
            </AuthGate>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
