import React from 'react';
import { Image, ImageSourcePropType, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, minTouchTarget, radii } from '../theme/tokens';

interface MediaViewerProps {
  visible: boolean;
  source: ImageSourcePropType | undefined;
  title: string;
  onClose: () => void;
}

// Animação do exercício em tela cheia (botão ▶ da Ficha). Tocar em qualquer lugar fecha.
export function MediaViewer({ visible, source, title, onClose }: MediaViewerProps) {
  const insets = useSafeAreaInsets();
  if (!source) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar animação"
      >
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.frame}>
          <Image source={source} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors />
        </View>
        <View style={styles.closeButton}>
          <Text style={styles.closeLabel}>Fechar</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(10,20,30,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 20,
  },
  title: { fontSize: 17, fontWeight: '600', color: colors.surface, textAlign: 'center' },
  // O GIF vem em fundo claro; o quadro branco evita bordas estranhas ao redor.
  frame: { width: '100%', aspectRatio: 1, maxWidth: 520, backgroundColor: colors.surface, borderRadius: radii.card, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  closeButton: {
    minHeight: minTouchTarget,
    paddingHorizontal: 28,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: { fontSize: 15, fontWeight: '700', color: colors.surface },
});
