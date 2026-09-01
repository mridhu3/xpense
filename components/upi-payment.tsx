import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Card, colors } from "@/components/xpense-ui";

export function UpiPaymentCard() {
  const [vpa, setVpa] = useState("");
  const [amount, setAmount] = useState("");

  const openUpi = async () => {
    const cleanVpa = vpa.trim();
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
    if (!cleanVpa.includes("@")) { Alert.alert("Enter a valid UPI ID", "Example: name@upi"); return; }
    const params = new URLSearchParams({ pa: cleanVpa, pn: "XPense", ...(numericAmount > 0 ? { am: numericAmount.toFixed(2) } : {}), cu: "INR", tn: "XPense payment" });
    const url = `upi://pay?${params.toString()}`;
    if (!(await Linking.canOpenURL(url))) { Alert.alert("No UPI app found", "Install Google Pay, PhonePe, Paytm, or another UPI app first."); return; }
    await Linking.openURL(url);
  };

  return <Card style={styles.card}><View style={styles.header}><View style={styles.icon}><MaterialIcons name="qr-code-2" size={21} color={colors.teal} /></View><View style={styles.copy}><Text style={styles.title}>Pay by UPI</Text><Text style={styles.body}>Open an installed UPI app using a secure payment intent.</Text></View></View><View style={styles.row}><TextInput value={vpa} onChangeText={setVpa} placeholder="Payee UPI ID · name@upi" placeholderTextColor="#A7B2B9" autoCapitalize="none" style={[styles.input, { flex: 1.5 }]} /><TextInput value={amount} onChangeText={setAmount} placeholder="₹ amount" placeholderTextColor="#A7B2B9" keyboardType="decimal-pad" style={[styles.input, { flex: 1 }]} /></View><Pressable onPress={openUpi} style={({ pressed }) => [styles.button, pressed && { opacity: 0.72 }]}><MaterialIcons name="open-in-new" size={17} color="#fff" /><Text style={styles.buttonText}>Open UPI payment</Text></Pressable><Text style={styles.note}>This launches your chosen UPI app; XPense does not handle bank credentials.</Text></Card>;
}

const styles = StyleSheet.create({ card: { padding: 15, marginBottom: 22 }, header: { flexDirection: "row", alignItems: "center" }, icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.tealSoft, alignItems: "center", justifyContent: "center" }, copy: { flex: 1, marginLeft: 11 }, title: { color: colors.ink, fontSize: 14, fontWeight: "900" }, body: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, row: { flexDirection: "row", gap: 8, marginTop: 13 }, input: { height: 44, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 11, color: colors.ink, fontSize: 11 }, button: { height: 44, borderRadius: 12, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, marginTop: 11 }, buttonText: { color: "#fff", fontSize: 12, fontWeight: "900" }, note: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 9 }, });
