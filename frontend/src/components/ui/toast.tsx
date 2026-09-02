import { Ionicons } from '@expo/vector-icons';
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ToastKind = 'success' | 'error';
type ToastState = { message: string; kind: ToastKind; key: number } | null;

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/** App-wide animated toast. Mount once in the root layout. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, kind, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      <View style={styles.host}>
        {children}
        {toast && (
          <Animated.View
            key={toast.key}
            entering={FadeInDown.springify().damping(18)}
            exiting={FadeOutUp.duration(200)}
            style={[
              styles.toast,
              CardShadow,
              {
                backgroundColor: toast.kind === 'success' ? theme.successBg : theme.dangerBg,
                borderColor: toast.kind === 'success' ? theme.success : theme.danger,
              },
            ]}>
            <Ionicons
              name={toast.kind === 'success' ? 'checkmark-circle' : 'warning'}
              size={16}
              color={toast.kind === 'success' ? theme.success : theme.danger}
            />
            <Text
              style={[
                styles.message,
                { color: toast.kind === 'success' ? theme.success : theme.danger },
              ]}>
              {toast.message}
            </Text>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    bottom: Spacing.five + Spacing.four,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    maxWidth: 480,
  },
  icon: {
    fontSize: 14,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
});
