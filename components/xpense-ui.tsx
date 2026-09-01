import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatINR } from "@/lib/xpense-store";

export const colors = {
  navy: "#132A3A",
  ink: "#13202B",
  muted: "#71808C",
  canvas: "#F7F9FA",
  card: "#FFFFFF",
  line: "#E7EDF1",
  orange: "#FF7A45",
  orangeSoft: "#FFF0EA",
  teal: "#16B8A6",
  tealSoft: "#E6F8F5",
  purple: "#8B5CF6",
  purpleSoft: "#F0ECFF",
  yellow: "#F8C64A",
  yellowSoft: "#FFF8DC",
  red: "#E96C70",
  green: "#39B77B",
};

export function Card({ children, style, dark = false }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; dark?: boolean }) {
  return <View style={[styles.card, dark && styles.darkCard, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onAction} style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.6 }]}><Text style={styles.actionText}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function IconBubble({ name, color = colors.orange, iconColor = colors.orange, size = 42 }: { name: keyof typeof iconMap; color?: string; iconColor?: string; size?: number }) {
  return <View style={[styles.iconBubble, { backgroundColor: color, width: size, height: size, borderRadius: size / 3 }]}><MaterialIcons name={iconMap[name]} size={size * 0.48} color={iconColor} /></View>;
}

export const iconMap = {
  restaurant: "restaurant",
  "directions-car": "directions-car",
  "shopping-bag": "shopping-bag",
  "receipt-long": "receipt-long",
  movie: "movie",
  "more-horiz": "more-horiz",
  savings: "savings",
  weekend: "weekend",
  school: "school",
  "local-fire-department": "local-fire-department",
  "auto-awesome": "auto-awesome",
} as const;

export function ProgressBar({ value, total, color = colors.orange, height = 8 }: { value: number; total: number; color?: string; height?: number }) {
  const percent = total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0;
  return <View style={[styles.progressTrack, { height }]}><View style={[styles.progressFill, { width: `${percent * 100}%`, height, backgroundColor: color }]} /></View>;
}

export function Currency({ amount, style, color = colors.ink }: { amount: number; style?: object; color?: string }) {
  return <Text style={[styles.currency, { color }, style]}>{formatINR(amount)}</Text>;
}

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return <View style={styles.logoRow}><View style={styles.logoMark}><Text style={styles.logoX}>X</Text></View>{compact ? null : <Text style={styles.logoText}>XPense</Text>}</View>;
}

export function MiniStat({ label, value, tint = colors.orange }: { label: string; value: string; tint?: string }) {
  return <View style={styles.miniStat}><View style={[styles.miniDot, { backgroundColor: tint }]} /><View><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text></View></View>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <View style={styles.emptyState}><IconSymbol name="sparkles" size={30} color={colors.orange} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.line },
  darkCard: { backgroundColor: colors.navy, borderColor: colors.navy },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  actionButton: { paddingVertical: 4, paddingHorizontal: 2 },
  actionText: { color: colors.orange, fontSize: 13, fontWeight: "800" },
  iconBubble: { alignItems: "center", justifyContent: "center" },
  progressTrack: { backgroundColor: "#EAF0F2", borderRadius: 99, overflow: "hidden" },
  progressFill: { borderRadius: 99 },
  currency: { fontWeight: "800", letterSpacing: -0.4 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoMark: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] },
  logoX: { color: "#fff", fontSize: 19, fontWeight: "900", transform: [{ rotate: "8deg" }] },
  logoText: { color: colors.ink, fontSize: 20, fontWeight: "900", letterSpacing: -0.8 },
  miniStat: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  miniValue: { color: colors.ink, fontSize: 14, fontWeight: "800", marginTop: 1 },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 26 },
  emptyTitle: { color: colors.ink, fontWeight: "800", fontSize: 16, marginTop: 10 },
  emptyBody: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 5 },
});
