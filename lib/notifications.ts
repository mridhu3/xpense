import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { firebaseAuth, firestore } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") throw new Error("Push notifications require the Android build");
  const existing = await Notifications.getPermissionsAsync();
  let permission = existing.status;
  if (permission !== "granted") permission = (await Notifications.requestPermissionsAsync()).status;
  if (permission !== "granted") throw new Error("Notification permission was not granted");
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  } catch {
    token = (await Notifications.getDevicePushTokenAsync()).data as string;
  }
  const user = firebaseAuth?.currentUser;
  if (user && firestore) {
    await setDoc(doc(firestore, "users", user.uid, "pushTokens", encodeURIComponent(token)), { token, platform: Platform.OS, updatedAt: serverTimestamp() }, { merge: true });
  }
  return token;
}

export async function scheduleTestNotification() {
  await Notifications.scheduleNotificationAsync({ content: { title: "XPense reminder", body: "Your test alert is working. Keep your spending on track.", data: { type: "test" } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 } });
}
