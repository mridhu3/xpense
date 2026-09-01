# XPense

XPense is a React Native budgeting app built with **Expo SDK 54**, **Expo Router**, **TypeScript**, NativeWind, Firebase Authentication/Firestore, AI receipt scanning, voice quick-add, UPI intent payments, and push-notification support.

The repository includes the Android Firebase configuration required by the current Expo project. The app is local-first: expenses, goals, quests, and profile settings remain available offline and are isolated per signed-in account when Firebase sync is enabled.

## Requirements

Install the following before starting:

- Node.js 20 or newer
- Git
- pnpm 9 or newer
- Expo Go for a quick development preview, or Android Studio for an Android emulator
- An Expo account for EAS cloud builds

Check your installed versions:

```bash
node --version
pnpm --version
```

If pnpm is not installed, install it with:

```bash
npm install --global pnpm
```

## Download and install XPense

Clone the public repository and install all dependencies. Run these commands from a terminal:

```bash
git clone https://github.com/mridhu3/xpense.git
cd xpense
pnpm install
```

The `pnpm install` step is required. Without it, errors such as **“Failed to resolve plugin for module expo-router”** can occur because `node_modules` does not exist yet.

## Run the app with Expo

For the normal Expo development server:

```bash
npx expo start
```

Then choose one of the following:

- Scan the QR code with **Expo Go** on an Android phone connected to the same network.
- Press `a` to open a connected Android emulator.
- Press `w` to open the web version in a browser.

You can also use the project shortcuts:

```bash
pnpm android  # Open through Expo on Android
pnpm ios      # Open through Expo on iOS/macOS only
```

Expo Go is useful for inspecting the UI, but the complete production feature set requires a development or release build because Firebase native configuration, push notifications, camera access, and microphone features use native modules.

## Configure Firebase

The Android Firebase file is already included as `google-services.json`. For optional client configuration overrides, copy the example environment file:

```bash
cp .env.example .env
```

Then fill in the `EXPO_PUBLIC_FIREBASE_*` values only if you want to override the bundled Firebase project configuration. Do not commit private server credentials, access tokens, or production secrets.

Before using account sync in production, verify the following in the Firebase Console:

1. Enable **Authentication → Sign-in method → Email/Password**.
2. Create or select a Firestore database.
3. Deploy the rules from `firestore.rules`.
4. Confirm that the Android package is `com.example.xpense`.

More Firebase-specific guidance is available in [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md).

## Create an installable Android APK

The repository is linked to the Expo project `@mridhu/xpense`. Install the EAS CLI and authenticate with your own Expo account:

```bash
npm install --global eas-cli
eas login
```

Create an installable APK for testing or direct Android installation:

```bash
eas build --platform android --profile preview
```

EAS prints a build page URL when the job starts. Open the completed build page, download the `.apk`, and install it on an Android device. Android may ask you to allow installation from the browser or file manager.

If EAS reports that the project is not configured, run this once and retry:

```bash
eas init --account mridhu --non-interactive
eas build --platform android --profile preview
```

If you are building from a freshly downloaded copy, always run `pnpm install` before `eas build`.

## Publish to Google Play

For Google Play, build an Android App Bundle rather than an APK:

```bash
eas build --platform android --profile production
```

The output is an `.aab` file. Upload it in [Google Play Console](https://play.google.com/console), or submit through EAS after configuring the required Play Console service account:

```bash
eas submit --platform android --profile production
```

For the first release, complete Play Console testing, privacy policy, data-safety, content-rating, app-access, and store-listing requirements. Do not use the preview APK as the Play Store release artifact.

## Useful project commands

```bash
pnpm dev       # Start the development server and web Metro process
pnpm check     # Run TypeScript validation
pnpm lint      # Run Expo lint
pnpm test      # Run Vitest tests
pnpm build     # Build the server bundle
pnpm format    # Format project files
```

## Troubleshooting

### `Failed to resolve plugin for module "expo-router"`

Dependencies are missing. From the repository root, run:

```bash
pnpm install
```

Then retry the Expo or EAS command.

### EAS says you are not logged in

Authenticate in the same terminal where you run the build:

```bash
eas login
eas whoami
```

The second command should display your Expo account.

### EAS browser login opens a localhost error

Use a personal terminal instead of the sandbox browser callback. Run `eas login` locally, complete the browser login, and then rerun the build. Never share an Expo password or access token in a public issue or repository.

### Native features do not work in Expo Go

Build a development or preview APK. Expo Go cannot include every native configuration used by XPense, especially Firebase Android services, push notifications, camera permissions, and microphone recording.

### Firebase login or sync does not work

Confirm that Email/Password authentication is enabled, the Firestore rules are deployed, and the Android package in Firebase matches `com.example.xpense`. Also check that the device has network access for the first sign-in and sync.

## Repository layout

```text
app/                 Expo Router screens
components/          Reusable UI and feature components
lib/                 Local store, Firebase, API, and theme helpers
server/               AI receipt, voice, and application server routes
shared/               Shared types and error definitions
assets/              App icons and splash assets
app.config.ts        Expo and Android configuration
eas.json             EAS preview and production profiles
FIREBASE_SETUP.md    Firebase setup notes
DEPLOY.md            Detailed Android deployment notes
```

## License and contributions

This repository is public for the XPense project. Review Firebase rules, AI processing behavior, notification credentials, and privacy requirements before deploying a public production release.
