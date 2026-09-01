import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Card, colors } from "@/components/xpense-ui";
import { firebaseConfigured, firebaseSignIn, firebaseSignOut, firebaseSignUp, pullTransactions, pushTransactions, watchFirebaseUser } from "@/lib/firebase";
import { useXPense, type Transaction } from "@/lib/xpense-store";

export function FirebaseAccountCard() {
  const { transactions, mergeTransactions } = useXPense();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => watchFirebaseUser((user) => setUserEmail(user?.email ?? null)), []);

  const sync = async (uid: string, localTransactions = transactions) => {
    const remote = await pullTransactions(uid);
    const mergedMap = new Map<string, Transaction>();
    [...remote, ...localTransactions].forEach((transaction) => mergedMap.set(transaction.id, transaction));
    const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    mergeTransactions(remote);
    await pushTransactions(uid, merged);
    setStatus(`Synced ${merged.length} expenses just now`);
  };

  const submit = async () => {
    setBusy(true); setStatus("");
    try {
      const credential = mode === "signin" ? await firebaseSignIn(email, password) : await firebaseSignUp(email, password);
      await sync(credential.user.uid);
    } catch (error) {
      setStatus(error instanceof Error ? error.message.replace("Firebase: ", "") : "Could not connect to Firebase");
    } finally { setBusy(false); }
  };

  if (!firebaseConfigured) return <Card style={styles.card}><View style={styles.header}><View style={styles.cloudIcon}><MaterialIcons name="cloud-off" size={21} color={colors.muted} /></View><View style={styles.copy}><Text style={styles.title}>Cloud sync ready</Text><Text style={styles.body}>Add your Firebase web config to enable secure multi-device access.</Text></View></View><Text style={styles.setupHint}>Set EXPO_PUBLIC_FIREBASE_* variables before your next build.</Text></Card>;

  if (userEmail) return <Card style={styles.card}><View style={styles.header}><View style={[styles.cloudIcon, { backgroundColor: colors.tealSoft }]}><MaterialIcons name="cloud-done" size={21} color={colors.teal} /></View><View style={styles.copy}><Text style={styles.title}>Synced account</Text><Text style={styles.body}>{userEmail}</Text></View></View><View style={styles.actions}><Pressable onPress={async () => { setBusy(true); try { const { firebaseAuth } = await import("@/lib/firebase"); if (firebaseAuth?.currentUser) await sync(firebaseAuth.currentUser.uid); } catch { setStatus("Sync failed. Your local data is safe."); } finally { setBusy(false); } }} style={styles.outline}><Text style={styles.outlineText}>{busy ? "Syncing…" : "Sync now"}</Text></Pressable><Pressable onPress={() => firebaseSignOut()} style={styles.signout}><Text style={styles.signoutText}>Sign out</Text></Pressable></View>{status ? <Text style={styles.status}>{status}</Text> : null}</Card>;

  return <Card style={styles.card}><View style={styles.header}><View style={[styles.cloudIcon, { backgroundColor: colors.orangeSoft }]}><MaterialIcons name="lock" size={21} color={colors.orange} /></View><View style={styles.copy}><Text style={styles.title}>Sign in to sync</Text><Text style={styles.body}>Your data stays local until you choose to sync.</Text></View></View><TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#A7B2B9" autoCapitalize="none" keyboardType="email-address" style={styles.input} /><TextInput value={password} onChangeText={setPassword} placeholder="Password (6+ characters)" placeholderTextColor="#A7B2B9" secureTextEntry style={styles.input} /><Pressable disabled={busy || !email || password.length < 6} onPress={submit} style={[styles.primary, (busy || !email || password.length < 6) && styles.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{mode === "signin" ? "Sign in securely" : "Create account"}</Text>}</Pressable><Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")}><Text style={styles.switch}>{mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}</Text></Pressable>{status ? <Text style={styles.error}>{status}</Text> : null}</Card>;
}

const styles = StyleSheet.create({ card: { padding: 15, marginBottom: 20 }, header: { flexDirection: "row", alignItems: "center" }, cloudIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EFF2F3", alignItems: "center", justifyContent: "center" }, copy: { flex: 1, marginLeft: 11 }, title: { color: colors.ink, fontSize: 14, fontWeight: "900" }, body: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, setupHint: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 11, paddingLeft: 53 }, input: { height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 13, color: colors.ink, fontSize: 13, marginTop: 11 }, primary: { height: 46, backgroundColor: colors.orange, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 12 }, disabled: { backgroundColor: "#D7DEE1" }, primaryText: { color: "#fff", fontSize: 13, fontWeight: "900" }, switch: { color: colors.orange, fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 12 }, error: { color: colors.red, fontSize: 10, lineHeight: 15, marginTop: 10 }, actions: { flexDirection: "row", gap: 9, marginTop: 13 }, outline: { borderWidth: 1, borderColor: colors.teal, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 }, outlineText: { color: colors.teal, fontSize: 11, fontWeight: "900" }, signout: { paddingHorizontal: 10, paddingVertical: 8 }, signoutText: { color: colors.muted, fontSize: 11, fontWeight: "800" }, status: { color: colors.teal, fontSize: 10, marginTop: 9 }, });
