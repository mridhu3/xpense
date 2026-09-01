import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { colors, IconBubble } from "@/components/xpense-ui";
import { categoryMeta, useXPense, type Category, type Wallet } from "@/lib/xpense-store";

const categories: Category[] = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];
const wallets: Wallet[] = ["UPI", "Cash", "Card"];

export default function AddExpenseScreen() {
  const { addExpense } = useXPense();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [wallet, setWallet] = useState<Wallet>("UPI");
  const [note, setNote] = useState("");
  const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
  const canSave = numericAmount > 0 && merchant.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    addExpense({ merchant: merchant.trim(), amount: numericAmount, category, wallet, note: note.trim() || undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    router.back();
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}><MaterialIcons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={styles.title}>Add expense</Text><View style={{ width: 42 }} /></View>
      <Text style={styles.helper}>Log it now. Your future self will thank you.</Text>
      <View style={styles.amountBox}><Text style={styles.amountPrefix}>₹</Text><TextInput value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor="#C3CDD2" keyboardType="decimal-pad" style={styles.amountInput} /><Text style={styles.amountHint}>INR</Text></View>
      <Text style={styles.label}>WHAT DID YOU SPEND ON?</Text><TextInput value={merchant} onChangeText={setMerchant} placeholder="e.g. Chai Point, Uber, Netflix" placeholderTextColor="#A7B2B9" style={styles.input} returnKeyType="next" />
      <Text style={styles.label}>CATEGORY</Text><View style={styles.choiceGrid}>{categories.map((item) => { const meta = categoryMeta[item]; const active = item === category; return <Pressable key={item} onPress={() => setCategory(item)} style={[styles.choice, active && { backgroundColor: `${meta.color}12`, borderColor: meta.color }]}><IconBubble name={meta.icon as never} color={active ? `${meta.color}25` : "#F0F3F4"} iconColor={active ? meta.color : colors.muted} size={35} /><Text style={[styles.choiceText, active && { color: meta.color }]}>{item}</Text></Pressable>; })}</View>
      <Text style={styles.label}>PAID WITH</Text><View style={styles.walletRow}>{wallets.map((item) => <Pressable key={item} onPress={() => setWallet(item)} style={[styles.wallet, wallet === item && styles.walletActive]}><MaterialIcons name={item === "UPI" ? "qr-code-2" : item === "Cash" ? "payments" : "credit-card"} size={18} color={wallet === item ? colors.orange : colors.muted} /><Text style={[styles.walletText, wallet === item && styles.walletTextActive]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.label}>NOTE <Text style={styles.optional}>(OPTIONAL)</Text></Text><TextInput value={note} onChangeText={setNote} placeholder="Add a little context" placeholderTextColor="#A7B2B9" style={styles.input} />
      <Pressable disabled={!canSave} onPress={save} style={({ pressed }) => [styles.saveButton, !canSave && styles.saveDisabled, pressed && canSave && { transform: [{ scale: 0.98 }] }]}><MaterialIcons name="check" size={20} color="#fff" /><Text style={styles.saveText}>Save expense</Text></Pressable>
      <Text style={styles.privacy}>Saved securely on this device · sync can be connected later</Text>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 40 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line }, title: { color: colors.ink, fontSize: 18, fontWeight: "900" }, helper: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 18, marginBottom: 22 }, amountBox: { height: 98, backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 21, marginBottom: 27 }, amountPrefix: { color: colors.orange, fontSize: 34, fontWeight: "900", marginRight: 7 }, amountInput: { flex: 1, color: colors.ink, fontSize: 40, fontWeight: "900", padding: 0 }, amountHint: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1 }, label: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 9, marginTop: 5 }, optional: { fontWeight: "600", letterSpacing: 0 }, input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 15, height: 50, color: colors.ink, fontSize: 14, marginBottom: 22 }, choiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 }, choice: { width: "31.7%", minHeight: 72, backgroundColor: colors.card, borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 9, alignItems: "center", justifyContent: "center" }, choiceText: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 5 }, walletRow: { flexDirection: "row", gap: 9, marginBottom: 22 }, wallet: { flex: 1, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }, walletActive: { backgroundColor: colors.orangeSoft, borderColor: colors.orange }, walletText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, walletTextActive: { color: colors.orange }, saveButton: { height: 54, borderRadius: 16, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 5 }, saveDisabled: { backgroundColor: "#D7DEE1" }, saveText: { color: "#fff", fontSize: 15, fontWeight: "900" }, privacy: { color: colors.muted, fontSize: 10, textAlign: "center", marginTop: 14 },
});
