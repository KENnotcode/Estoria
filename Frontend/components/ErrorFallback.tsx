import { Feather } from '@expo/vector-icons';
import { reloadAppAsync } from 'expo';
import { useCallback, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, radius } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

const MONOSPACE_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/** Recovery screen rendered by `ErrorBoundary` when a render error escapes. */
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const handleRestart = useCallback(async () => {
    try {
      await reloadAppAsync();
    } catch {
      resetError();
    }
  }, [resetError]);

  const closeDetails = useCallback(() => setIsDetailsVisible(false), []);
  const openDetails = useCallback(() => setIsDetailsVisible(true), []);

  const errorDetails = error.stack ? `${error.message}\n\n${error.stack}` : error.message;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View error details"
          onPress={openDetails}
          style={({ pressed }) => [
            styles.detailsButton,
            {
              top: insets.top + 16,
              backgroundColor: colors.card,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="alert-circle" size={20} color={colors.foreground} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          Please reload the app to continue.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.reloadButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.reloadLabel, { color: colors.primaryForeground }]}>Try Again</Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isDetailsVisible}
          animationType="slide"
          transparent
          onRequestClose={closeDetails}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Error Details</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close error details"
                  onPress={closeDetails}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                >
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.modalContent,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
                  <Text
                    selectable
                    style={[styles.errorText, { color: colors.foreground, fontFamily: MONOSPACE_FONT }]}
                  >
                    {errorDetails}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 600,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    lineHeight: 40,
  },
  message: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  reloadButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: radius.md,
    minWidth: 200,
  },
  pressed: {
    opacity: 0.9,
  },
  reloadLabel: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '90%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fontFamily.semiBold,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 16,
  },
  errorContainer: {
    width: '100%',
    borderRadius: radius.md,
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
