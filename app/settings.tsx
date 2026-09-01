import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { Card, colors } from "@/components/xpense-ui";
import { UpiPaymentCard } from "@/components/upi-payment";
import { registerForPushNotificationsAsync, scheduleTestNotification } from "@/lib/notifications";
import { formatINR, useXPense } from "@/lib/xpense-store";

export default function SettingsScreen() {
  const [nudges, setNudges] = useState(true);
  const [weekly, setWeekly] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState("");
  const { monthlyBudget, setMonthlyBudget } = useXPense();
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));
  const [budgetStatus, setBudgetStatus] = useState("");
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
    <Card style={styles.budgetCard}><View style={styles.budgetHeader}><View><Text style={styles.budgetTitle}>Monthly budget</Text><Text style={styles.rowDetail}>Current limit: {formatINR(monthlyBudget)}</Text></View><MaterialIcons name="edit" size={19} color={colors.orange} /></View><View style={styles.budgetEdit}><Text style={styles.currencyPrefix}>₹</Text><TextInput value={budgetInput} onChangeText={setBudgetInput} keyboardType="decimal-pad" placeholder="18000" placeholderTextColor="#A7B2B9" style={styles.budgetInput} /><Pressable onPress={() => { const next = Number(budgetInput.replace(/[^0-9.]/g, "")); if (next > 0) { setMonthlyBudget(next); setBudgetStatus("Budget updated"); } else setBudgetStatus("Enter a positive amount"); }} style={styles.budgetSave}><Text style={styles.budgetSaveText}>Save</Text></Pressable></View>{budgetStatus ? <Text style={styles.budgetStatus}>{budgetStatus}</Text> : null}</Card>
    <Text style={styles.label}>PREFERENCES</Text><Card style={styles.card}><ToggleRow icon="notifications-none" title="Smart nudges" detail="Warn me before I overspend" value={nudges} onChange={setNudges} /><ToggleRow icon="notifications-active" title="Notifications" detail="Receive reminders on this device" value={pushEnabled} onChange={enablePush} /><ToggleRow icon="assessment" title="Weekly report card" detail="Get a Sunday money recap" value={weekly} onChange={setWeekly} /><Pressable onPress={sendTest} style={({ pressed }) => [styles.testButton, pressed && { opacity: 0.7 }]}><MaterialIcons name="send" size={15} color={colors.orange} /><Text style={styles.testText}>Send a test alert</Text></Pressable>{pushStatus ? <Text style={styles.pushStatus}>{pushStatus}</Text> : null}</Card>
    <Text style={styles.label}>YOUR DATA</Text><Card style={styles.card}><SettingRow icon="cloud-done" title="Sync & backup" detail="Local-first · Last synced just now" /></Card>
    <Text style={styles.label}>CONNECT</Text><UpiPaymentCard />
    <Text style={styles.version}>XPense v1.0.0 · Built for student life</Text>
  </ScrollView></ScreenContainer>;
}

function ToggleRow({ icon, title, detail, value, onChange }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; detail: string; value: boolean; onChange: (next: boolean) => void }) { return <View style={styles.row}><View style={styles.icon}><MaterialIcons name={icon} size={20} color={colors.orange} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: "#D8E0E4", true: "#FFB08B" }} thumbColor={value ? colors.orange : "#fff"} /> </View>; }
function SettingRow({ icon, title, detail, danger }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; detail: string; danger?: boolean }) { return <Pressable onPress={() => undefined} style={({ pressed }) => [styles.row, pressed && { opacity: 0.62 }]}><View style={[styles.icon, danger && { backgroundColor: "#FFF0F0" }]}><MaterialIcons name={icon} size={20} color={danger ? colors.red : colors.orange} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, danger && { color: colors.red }]}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View><MaterialIcons name="chevron-right" size={21} color={colors.muted} /></Pressable>; }

const styles = StyleSheet.create({ screen: { backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 40 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" }, title: { color: colors.ink, fontSize: 18, fontWeight: "900" }, subtitle: { color: colors.muted, fontSize: 13, marginTop: 17, marginBottom: 18 }, budgetCard: { padding: 15, marginBottom: 22 }, budgetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, budgetTitle: { color: colors.ink, fontSize: 14, fontWeight: "900" }, budgetEdit: { flexDirection: "row", alignItems: "center", marginTop: 11, gap: 7 }, currencyPrefix: { color: colors.orange, fontSize: 18, fontWeight: "900" }, budgetInput: { flex: 1, height: 42, borderWidth: 1, borderColor: colors.line, borderRadius: 11, paddingHorizontal: 10, color: colors.ink, fontSize: 13 }, budgetSave: { height: 42, borderRadius: 11, paddingHorizontal: 15, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" }, budgetSaveText: { color: "#fff", fontSize: 11, fontWeight: "900" }, budgetStatus: { color: colors.teal, fontSize: 10, marginTop: 8 }, label: { color: colors.muted, fontSize: 10, letterSpacing: 1, fontWeight: "900", marginBottom: 9, marginTop: 4 }, card: { paddingHorizontal: 14, paddingVertical: 2, marginBottom: 22 }, row: { minHeight: 64, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.line }, icon: { width: 37, height: 37, borderRadius: 12, backgroundColor: colors.orangeSoft, alignItems: "center", justifyContent: "center" }, rowCopy: { flex: 1, paddingHorizontal: 11 }, rowTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" }, rowDetail: { color: colors.muted, fontSize: 10, marginTop: 4 }, testButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12 }, testText: { color: colors.orange, fontSize: 11, fontWeight: "900" }, pushStatus: { color: colors.muted, fontSize: 10, lineHeight: 15, paddingBottom: 9 }, version: { color: colors.muted, fontSize: 10, textAlign: "center", marginTop: 2 }, });
