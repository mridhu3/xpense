# XPense Android deployment

XPense is an Expo SDK 54 / React Native app with a local-first student budgeting MVP. The Android application identifier is `com.app.xpense`.

## 1. Run the app locally

```bash
cd xpense
pnpm install
pnpm start
```

For a device preview, install Expo Go, scan the QR code shown by the Expo CLI, or run `pnpm android` with an Android emulator connected.

## 2. Create an installable APK

Install and authenticate with Expo Application Services (EAS):

```bash
npm install --global eas-cli
eas login
```

Build the internal-testing APK profile:

```bash
eas build --platform android --profile preview
```

EAS will print a build URL when the cloud build completes. Download the `.apk` from that URL and install it on an Android device for testing. The `preview` profile is already configured in `eas.json` with `buildType: apk`.

## 3. Build a Google Play release

Use the production profile to create an Android App Bundle (`.aab`):

```bash
eas build --platform android --profile production
```

The first production build will ask EAS to create or reuse Android signing credentials. Keep those credentials managed by EAS unless you have an existing Play signing setup. Upload the resulting `.aab` in Google Play Console, or submit directly after configuring the Play Console service account:

```bash
eas submit --platform android --profile production
```

For future releases, increment the version through EAS remote app versioning or update `version` in `app.config.ts` when you want a coordinated app release.

## 4. What is included

The current app includes a polished, phone-sized flow for the XPense core loop: a live dashboard, monthly budget usage, spending-category breakdowns, smart nudge messaging, recent expenses, quick-add expense entry, activity filters and analytics, goal vaults with contributions, XP/levels, coins, streaks, badges, quests, a weekly report card, profile, privacy-first local storage, and settings.

Transactions, goals, quest rewards, XP, coins, and streak data persist on-device with AsyncStorage. The app is intentionally usable offline. Bank/UPI auto-sync, OCR receipt capture, voice quick-add, AI categorization/coach, Firebase Auth, Firestore squad sync, and push notifications are represented as future integration points rather than pretending to be connected without credentials or a backend contract.

## 5. Before public launch

Replace the demo profile and sample transactions with the real authentication flow, add server-side sync and privacy/consent screens, connect production AI and bank integrations through the server, configure notification credentials, and complete Play Console privacy, data-safety, content-rating, and testing requirements.
