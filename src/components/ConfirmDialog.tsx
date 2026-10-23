import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/ui";
import { colors, fonts, radii } from "@/lib/theme";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Тийм",
  cancelText = "Болих",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={cancelText} />
        <View style={styles.card}>
          <View style={[styles.marker, destructive && styles.markerDanger]} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <PressableScale onPress={onCancel} style={styles.action}>
              <View style={styles.cancelButton}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </View>
            </PressableScale>
            <PressableScale onPress={onConfirm} style={styles.action}>
              <View style={[styles.confirmButton, destructive && styles.confirmDanger]}>
                <Text style={styles.confirmText}>{confirmText}</Text>
              </View>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(3,3,8,0.78)",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#12121B",
    padding: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 18,
  },
  marker: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lilac,
    marginBottom: 18,
  },
  markerDanger: {
    backgroundColor: colors.rose,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 25,
    color: colors.text,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 22,
  },
  action: {
    flex: 1,
  },
  cancelButton: {
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cancelText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: colors.muted,
  },
  confirmButton: {
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.indigo,
  },
  confirmDanger: {
    backgroundColor: colors.roseDeep,
  },
  confirmText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: colors.white,
  },
});
