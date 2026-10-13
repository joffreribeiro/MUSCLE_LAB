import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme/tokens';

export interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((t: ToastState, durationMs = 2000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(t);
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, show, hide };
}

export function Toast({ toast, onHide }: { toast: ToastState | null; onHide: () => void }) {
  const insets = useSafeAreaInsets();
  if (!toast) return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <Text style={styles.message}>{toast.message}</Text>
        {toast.actionLabel ? (
          <Pressable
            onPress={() => {
              toast.onAction?.();
              onHide();
            }}
          >
            <Text style={styles.action}>{toast.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16 },
  bar: {
    backgroundColor: colors.navy700,
    borderRadius: radii.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: { flex: 1, fontSize: 14, color: colors.surface },
  action: { fontSize: 14, fontWeight: '700', color: colors.teal300 },
});
