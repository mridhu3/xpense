import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { colors, IconBubble } from "@/components/xpense-ui";
import { categoryMeta, formatINR, useXPense, type Category, type Wallet } from "@/lib/xpense-store";
import { trpc } from "@/lib/trpc";

const categories: Category[] = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];
const wallets: Wallet[] = ["UPI", "Cash", "Card"];

type ParsedExpense = { merchant: string; amount: number; category: Category; wallet: Wallet; confidence: number; note: string };

export default function AddExpenseScreen() {
  const { addExpense, monthlyBudget } = useXPense();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [wallet, setWallet] = useState<Wallet>("UPI");
  const [note, setNote] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const receiptMutation = trpc.receipt.analyze.useMutation();
  const voiceMutation = trpc.voice.transcribeAndParse.useMutation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
  const canSave = numericAmount > 0 && merchant.trim().length > 0;

  const applyParsedExpense = (parsed: ParsedExpense) => {
    setAmount(String(Math.round(parsed.amount)));
    setMerchant(parsed.merchant);
    setCategory(parsed.category);
    setWallet(parsed.wallet);
    setNote(parsed.note || "");
  };

  const analyzeReceipt = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    setReceiptUri(asset.uri);
    if (!asset.base64) {
      setAiStatus("Could not read this image. Try another photo.");
      return;
    }
    setAiStatus("Reading receipt with AI…");
    try {
      const parsed = await receiptMutation.mutateAsync({ imageDataUrl: `data:image/jpeg;base64,${asset.base64}` });
      applyParsedExpense(parsed);
      setAiStatus(`Receipt read · ${Math.round(parsed.confidence * 100)}% confident`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (error) {
      setAiStatus(error instanceof Error ? error.message : "Receipt scan failed. You can enter it manually.");
    }
  };

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.75, base64: true });
    await analyzeReceipt(result);
  };

  const takeReceipt = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Allow camera access to scan receipts.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.75, base64: true });
    await analyzeReceipt(result);
  };

  const toggleRecording = async () => {
    if (Platform.OS === "web") {
      setVoiceStatus("Voice capture is available in the Android build.");
      return;
    }
    if (recorderState.isRecording) {
      setVoiceStatus("Transcribing your expense…");
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) { setVoiceStatus("No recording was captured. Try again."); return; }
      try {
        const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const parsed = await voiceMutation.mutateAsync({ audioBase64, mimeType: "audio/m4a" });
        applyParsedExpense(parsed);
        setVoiceStatus(`Heard: “${parsed.transcript}”`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      } catch (error) {
        setVoiceStatus(error instanceof Error ? error.message : "Voice parsing failed. Try again or type the expense.");
      }
      return;
    }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) { Alert.alert("Microphone permission needed", "Allow microphone access for hands-free expense entry."); return; }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setVoiceStatus("Listening… say: 450 rupees at Chai Point");
  };

  const save = () => {
    if (!canSave) return;
    const result = addExpense({ merchant: merchant.trim(), amount: numericAmount, category, wallet, note: note.trim() || undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (result.exceeded) Alert.alert("Budget exceeded", `This expense puts you ${formatINR(Math.abs(result.remaining))} over your ${formatINR(monthlyBudget)} monthly budget. Your available money is now negative.`);
    router.back();
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}><MaterialIcons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={styles.title}>Add expense</Text><View style={{ width: 42 }} /></View>
      <Text style={styles.helper}>Log it now. Your future self will thank you.</Text>
      <View style={styles.aiTools}><Pressable onPress={pickReceipt} disabled={receiptMutation.isPending} style={({ pressed }) => [styles.aiTool, pressed && { opacity: 0.68 }]}><View style={styles.aiToolIcon}><MaterialIcons name="document-scanner" size={21} color={colors.orange} /></View><Text style={styles.aiToolTitle}>Scan receipt</Text><Text style={styles.aiToolSub}>Gallery image</Text></Pressable><Pressable onPress={takeReceipt} disabled={receiptMutation.isPending} style={({ pressed }) => [styles.aiTool, pressed && { opacity: 0.68 }]}><View style={[styles.aiToolIcon, { backgroundColor: colors.tealSoft }]}><MaterialIcons name="photo-camera" size={21} color={colors.teal} /></View><Text style={styles.aiToolTitle}>Take photo</Text><Text style={styles.aiToolSub}>Instant OCR</Text></Pressable><Pressable onPress={toggleRecording} style={({ pressed }) => [styles.aiTool, recorderState.isRecording && styles.voiceActive, pressed && { opacity: 0.68 }]}><View style={[styles.aiToolIcon, { backgroundColor: colors.purpleSoft }]}><MaterialIcons name={recorderState.isRecording ? "stop" : "mic"} size={21} color={colors.purple} /></View><Text style={styles.aiToolTitle}>{recorderState.isRecording ? "Stop & parse" : "Voice add"}</Text><Text style={styles.aiToolSub}>Hands-free</Text></Pressable></View>
      {receiptUri ? <View style={styles.receiptPreview}><Image source={{ uri: receiptUri }} style={styles.receiptImage} /><View style={styles.receiptStatus}><MaterialIcons name="auto-awesome" size={17} color={colors.orange} /><Text style={styles.receiptStatusText}>{aiStatus || "Receipt attached"}</Text></View></View> : null}
      {voiceStatus ? <View style={styles.voiceStatus}><MaterialIcons name={recorderState.isRecording ? "graphic-eq" : "record-voice-over"} size={17} color={colors.purple} /><Text style={styles.voiceStatusText}>{voiceStatus}</Text></View> : null}
      <View style={styles.amountBox}><Text style={styles.amountPrefix}>₹</Text><TextInput value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor="#C3CDD2" keyboardType="decimal-pad" style={styles.amountInput} /><Text style={styles.amountHint}>INR</Text></View>
      <Text style={styles.label}>WHAT DID YOU SPEND ON?</Text><TextInput value={merchant} onChangeText={setMerchant} placeholder="e.g. Chai Point, Uber, Netflix" placeholderTextColor="#A7B2B9" style={styles.input} returnKeyType="next" />
      <Text style={styles.label}>CATEGORY</Text><View style={styles.choiceGrid}>{categories.map((item) => { const meta = categoryMeta[item]; const active = item === category; return <Pressable key={item} onPress={() => setCategory(item)} style={[styles.choice, active && { backgroundColor: `${meta.color}12`, borderColor: meta.color }]}><IconBubble name={meta.icon as never} color={active ? `${meta.color}25` : "#F0F3F4"} iconColor={active ? meta.color : colors.muted} size={35} /><Text style={[styles.choiceText, active && { color: meta.color }]}>{item}</Text></Pressable>; })}</View>
      <Text style={styles.label}>PAID WITH</Text><View style={styles.walletRow}>{wallets.map((item) => <Pressable key={item} onPress={() => setWallet(item)} style={[styles.wallet, wallet === item && styles.walletActive]}><MaterialIcons name={item === "UPI" ? "qr-code-2" : item === "Cash" ? "payments" : "credit-card"} size={18} color={wallet === item ? colors.orange : colors.muted} /><Text style={[styles.walletText, wallet === item && styles.walletTextActive]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.label}>NOTE <Text style={styles.optional}>(OPTIONAL)</Text></Text><TextInput value={note} onChangeText={setNote} placeholder="Add a little context" placeholderTextColor="#A7B2B9" style={styles.input} />
      <Pressable disabled={!canSave} onPress={save} style={({ pressed }) => [styles.saveButton, !canSave && styles.saveDisabled, pressed && canSave && { transform: [{ scale: 0.98 }] }]}><MaterialIcons name="check" size={20} color="#fff" /><Text style={styles.saveText}>Save expense</Text></Pressable>
      <Text style={styles.privacy}>AI suggestions are editable · saved securely on this device</Text>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 40 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line }, title: { color: colors.ink, fontSize: 18, fontWeight: "900" }, helper: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 18, marginBottom: 18 }, aiTools: { flexDirection: "row", gap: 8, marginBottom: 15 }, aiTool: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 10, alignItems: "center" }, voiceActive: { borderColor: colors.purple, backgroundColor: colors.purpleSoft }, aiToolIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.orangeSoft, alignItems: "center", justifyContent: "center", marginBottom: 7 }, aiToolTitle: { color: colors.ink, fontSize: 10, fontWeight: "900" }, aiToolSub: { color: colors.muted, fontSize: 9, marginTop: 3 }, receiptPreview: { backgroundColor: colors.orangeSoft, borderRadius: 15, padding: 8, flexDirection: "row", alignItems: "center", marginBottom: 14 }, receiptImage: { width: 45, height: 45, borderRadius: 10 }, receiptStatus: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9 }, receiptStatusText: { color: colors.ink, fontSize: 11, fontWeight: "700", flex: 1 }, voiceStatus: { backgroundColor: colors.purpleSoft, borderRadius: 13, padding: 11, flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 }, voiceStatusText: { color: colors.ink, fontSize: 11, flex: 1 }, amountBox: { height: 98, backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 21, marginBottom: 27 }, amountPrefix: { color: colors.orange, fontSize: 34, fontWeight: "900", marginRight: 7 }, amountInput: { flex: 1, color: colors.ink, fontSize: 40, fontWeight: "900", padding: 0 }, amountHint: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1 }, label: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 9, marginTop: 5 }, optional: { fontWeight: "600", letterSpacing: 0 }, input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 15, height: 50, color: colors.ink, fontSize: 14, marginBottom: 22 }, choiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 }, choice: { width: "31.7%", minHeight: 72, backgroundColor: colors.card, borderRadius: 15, borderWidth: 1, borderColor: colors.line, padding: 9, alignItems: "center", justifyContent: "center" }, choiceText: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 5 }, walletRow: { flexDirection: "row", gap: 9, marginBottom: 22 }, wallet: { flex: 1, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }, walletActive: { backgroundColor: colors.orangeSoft, borderColor: colors.orange }, walletText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, walletTextActive: { color: colors.orange }, saveButton: { height: 54, borderRadius: 16, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 5 }, saveDisabled: { backgroundColor: "#D7DEE1" }, saveText: { color: "#fff", fontSize: 15, fontWeight: "900" }, privacy: { color: colors.muted, fontSize: 10, textAlign: "center", marginTop: 14 },
});
