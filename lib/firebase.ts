import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { collection, doc, getDocs, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

import type { Transaction } from "@/lib/xpense-store";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);
const firebaseApp = firebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

let auth = null as ReturnType<typeof getAuth> | null;
if (firebaseApp) {
  try {
    // Auth tokens are managed by Firebase; app data remains locally cached by XPense.
    auth = initializeAuth(firebaseApp);
  } catch {
    auth = getAuth(firebaseApp);
  }
}
export const firebaseAuth = auth;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;

export type CloudTransaction = Transaction & { ownerId: string };

export function watchFirebaseUser(callback: (user: User | null) => void) {
  if (!firebaseAuth) return () => undefined;
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function firebaseSignIn(email: string, password: string) {
  if (!firebaseAuth) throw new Error("Firebase is not configured yet");
  return signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function firebaseSignUp(email: string, password: string) {
  if (!firebaseAuth) throw new Error("Firebase is not configured yet");
  return createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function firebaseSignOut() {
  if (firebaseAuth) await signOut(firebaseAuth);
}

export async function pullTransactions(userId: string): Promise<Transaction[]> {
  if (!firestore) return [];
  const snapshot = await getDocs(collection(firestore, "users", userId, "transactions"));
  return snapshot.docs.map((item) => item.data() as Transaction).filter((item) => item.id && item.merchant);
}

export async function pushTransactions(userId: string, transactions: Transaction[]) {
  if (!firestore) return;
  await setDoc(doc(firestore, "users", userId), { updatedAt: serverTimestamp(), transactionCount: transactions.length }, { merge: true });
  await Promise.all(transactions.map((transaction) => setDoc(doc(firestore, "users", userId, "transactions", transaction.id), { ...transaction, ownerId: userId }, { merge: true })));
}
