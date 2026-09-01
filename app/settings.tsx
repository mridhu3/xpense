import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { Card, colors } from "@/components/xpense-ui";
import { UpiPaymentCard } from "@/components/upi-payment";
import { registerForPushNotificationsAsync, scheduleTestNotification } from "@/lib/notifications";

export default function SettingsScreen() {
  const [nudges, setNudges] = useState(true);
  const [weekly, setWeekly] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState("");
  const enablePush = async (next: boolean) => {
    setPushEnabled(next);
    if (!next) { setPushStatus("Push notifications paused"); return; }
    try { await registerForPushNotificationsAsync(); setPushStatus("Push notifications enabled"); }
    catch (error) { setPushEnabled(false); setPushStatus(error instanceof Error ? error.message : "Could not enable notifications"); }
  };
  const sendTest = async () => { try { await scheduleTestNotification(); setPushStatus("Test alert scheduled for 2 seconds from now"); } catch (error) { setPushStatus(error instanceof Error ? error.message : "Could not schedule alert"); } };
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.topRow}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={styles.title}>Settings</Text><View style={{ width: 42 }} /></View>
    <Text style={styles.subtitle}>Make XPense work the way you do.</Text>
    <Text style={styles.label}>PREFERENCES</Text><Card style={styles.card}><ToggleRow icon="notifications-none" title="Smart nudges" detail="Warn me before I overspend" value={nudges} onChange={setNudges} /><ToggleRow icon="notifications-active" title="Push notifications" detail="Receive reminders on this device" value={pushEnabled} onChange={enablePush} /><ToggleRow icon="assessment" title="Weekly report card" detail="Get a Sunday money recap" value={weekly} onChange={setWeekly} /><ToggleRow icon="fingerprint" title="App lock" detail="Use device security to open XPense" value={biometric} onChange={setBiometric} /><Pressable onPress={sendTest} style={({ pressed }) => [styles.testButton, pressed && { opacity: 0.7 }]}><MaterialIcons name="send" size={15} color={colors.orange} /><Text style={styles.testText}>Send a test alert</Text></Pressable>{pushStatus ? <Text style={styles.pushStatus}>{pushStatus}</Text> : null}</Card>
    <Text style={styles.label}>YOUR DATA</Text><Card style={styles.card}><SettingRow icon="cloud-done" title="Sync & backup" detail="Local-first · Last synced just now" /><SettingRow icon="file-download" title="Export transactions" detail="Download a CSV copy" /><SettingRow icon="delete-outline" title="Reset demo workspace" detail="Clear local data and start fresh" danger /></Card>
    <Text style={styles.label}>CONNECT</Text><UpiPaymentCard /><Card style={styles.card}><SettingRow icon="account-balance" title="Bank / UPI sync" detail="Secure read-only provider connection" /><SettingRow icon="groups" title="Squad invites" detail="Share progress with friends" /></Card>
    <Text style={styles.version}>XPense v1.0.0 · Built for student life</Text>
  </ScrollView></ScreenContainer>;
}

function ToggleRow({ icon, title, detail, value, onChange }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; detail: string; value: boolean; onChange: (next: boolean) => void }) { return <View style={styles.row}><View style={styles.icon}><MaterialIcons name={icon} size={20} color={colors.orange} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: "#D8E0E4", true: "#FFB08B" }} thumbColor={value ? colors.orange : "#fff"} /> </View>; }
function SettingRow({ icon, title, detail, danger }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; detail: string; danger?: boolean }) { return <Pressable onPress={() => undefined} style={({ pressed }) => [styles.row, pressed && { opacity: 0.62 }]}><View style={[styles.icon, danger && { backgroundColor: "#FFF0F0" }]}><MaterialIcons name={icon} size={20} color={danger ? colors.red : colors.orange} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, danger && { color: colors.red }]}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View><MaterialIcons name="chevron-right" size={21} color={colors.muted} /></Pressable>; }

const styles = StyleSheet.create({ screen: { backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 40 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" }, title: { color: colors.ink, fontSize: 18, fontWeight: "900" }, subtitle: { color: colors.muted, fontSize: 13, marginTop: 17, marginBottom: 25 }, label: { color: colors.muted, fontSize: 10, letterSpacing: 1, fontWeight: "900", marginBottom: 9, marginTop: 4 }, card: { paddingHorizontal: 14, paddingVertical: 2, marginBottom: 22 }, row: { minHeight: 64, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.line }, icon: { width: 37, height: 37, borderRadius: 12, backgroundColor: colors.orangeSoft, alignItems: "center", justifyContent: "center" }, rowCopy: { flex: 1, paddingHorizontal: 11 }, rowTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" }, rowDetail: { color: colors.muted, fontSize: 10, marginTop: 4 }, testButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12 }, testText: { color: colors.orange, fontSize: 11, fontWeight: "900" }, pushStatus: { color: colors.muted, fontSize: 10, lineHeight: 15, paddingBottom: 9 }, version: { color: colors.muted, fontSize: 10, textAlign: "center", marginTop: 2 }, });
