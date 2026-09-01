# Firebase setup for XPense

XPense uses Firebase Authentication for email/password accounts and Firestore for transaction sync. The app remains usable offline when Firebase is not configured.

## Create the Firebase project

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Register a Web app in Project settings and copy its config values.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. Create a Firestore database in production mode.
5. Deploy the included `firestore.rules` file so each user can read and write only their own `/users/{uid}` path.

```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules
```

## Configure Expo

Set the following variables in the Expo/EAS environment. They are client Firebase configuration values, not server admin credentials. Never add a Firebase Admin service-account JSON file to the mobile app.

```text
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

For an EAS build, configure them with the EAS environment workflow or your CI secret store, then build again:

```bash
eas env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value YOUR_VALUE --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value YOUR_VALUE --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value YOUR_VALUE --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value YOUR_VALUE --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value YOUR_VALUE --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value YOUR_VALUE --environment production
eas build --platform android --profile preview
```

The Profile tab contains the sign-in, account creation, sync-now, and sign-out controls. On first sync, local and remote transactions are merged by transaction ID and the combined set is uploaded back to Firestore.

## Security notes

The Firestore rules are the authorization boundary. Keep them deployed and do not loosen them to `allow read, write: if true`. Firebase client config values can be present in an Expo client bundle; Firebase Admin credentials must remain server-side and are not needed for this client-side sync design.
