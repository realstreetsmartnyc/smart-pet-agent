# Play Console Data Safety Form — Smart Pet Agent v1.0.0

Status: 2026-09-01 — pre-submission draft based on the verified debug APK
(`apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`, 166 MB,
package `ai.smartpet.agent`, versionCode 1, targetSdk 34) and the current
source tree. Fill into Play Console → Policy → App content → Data safety.

This form reflects the app's local-first posture: the desktop/mobile
companion stores pet state, permissions, and chat history **on-device only**;
outbound network is limited to AI provider calls the user explicitly
configures and initiates. No analytics, crash reporting, or third-party
tracking SDKs are bundled or initialized.

---

## Data the app collects and shares

### Data shared (only when the user chats)

| Category | What | When | Where it goes | Required? | Can user disable? |
|---|---|---|---|---|---|
| **Messages** | The user's chat prompt and prior turns needed for context | When the user sends a chat message | To the AI provider baseURL the user configured in Settings (e.g., local Ollama at `http://127.0.0.1:11434` or a hosted endpoint the user supplies with their own API key) | Yes — the app cannot function without chat | Yes — user picks the provider; if none configured, chat is disabled |

The app **does not** send any other data anywhere. There is no telemetry,
analytics, crash reporting, or background beacon.

### Data stored on device only (not shared, not transmitted by the app)

| Category | What | Why | User control |
|---|---|---|---|
| **App activity → Pet state** | Pet profile, intent, lifecycle history, custom pet packs the user imports/creates | Core product feature — the on-device pet companion | User can delete a pet, reset workspace, or uninstall |
| **App activity → Permissions** | Per-permission grant/deny state and audit log | Permission policy persistence | Cleared on uninstall; in-app "reset permissions" |
| **App activity → Chat history** | Local transcript of prior turns (used for context + UI history) | Conversation continuity | User can clear; cleared on uninstall |
| **App activity → Workspace files** | User-imported pet packs, exports | User-managed pet content | User-controlled files; cleared on uninstall |
| **Device or other IDs** | None collected by the app. (FCM/APNs tokens would be issued by Google/Apple only if remote push were enabled — it is not in v1.) | — | — |

### Data the app does NOT collect

- ❌ No location (fine or coarse).
- ❌ No contacts, calendar, or call/SMS logs.
- ❌ No microphone audio is stored or uploaded. The microphone permission is declared for in-session STT (speech-to-text) the user initiates; the captured audio is processed transiently and not retained.
- ❌ No photos/media is uploaded. The photo-library permission is for **importing** pet packs the user selects; the app reads the user-selected items and does not upload them.
- ❌ No camera images are uploaded. The camera permission is for peripherals the user explicitly approves (e.g., a local smart-camera feed); frames stay on device.
- ❌ No health, fitness, or biometric data beyond the optional `USE_BIOMETRIC` prompt for app-lock (handled by the OS; the app does not read biometric content).
- ❌ No purchase or financial data.
- ❌ No web browsing history.
- ❌ No advertising ID or device fingerprint.

### Security practices

- Data in transit: chat to user-configured providers uses HTTPS when the user supplies an `https://` baseURL; the user is responsible for the endpoint they configure. The app does not perform certificate pinning (user-configured endpoints vary).
- Data at rest: SQLite database (`better-sqlite3`) in the app's private data dir; no encryption-at-rest wrapper in v1 (relies on Android per-app sandboxing + optional biometric lock).
- Account required: **No.** The app has no account system.
- Account deletion: **N/A** (no account).
- Data deletion: user can clear chat history, delete pets, reset permissions, or uninstall (removes all app data).

### Permissions declared (from APK aapt2 dump)

The following permissions are in the built APK. Their actual data-handling
matches the table above; they appear here for Play Console cross-reference.

- `android.permission.INTERNET`, `android.permission.ACCESS_NETWORK_STATE` — required for the user-configured AI provider calls.
- `android.permission.CAMERA`, `android.permission.RECORD_AUDIO` — for the in-session peripherals the user approves (STT, smart-camera); data stays on device.
- `android.permission.POST_NOTIFICATIONS` — local ambient pet alerts only.
- `android.permission.USE_BIOMETRIC` — optional in-app lock; OS-mediated.
- `android.permission.READ_MEDIA_IMAGES` (and READ_MEDIA_VIDEO/AUDIO, READ_MEDIA_VISUAL_USER_SELECTED) — for user-selected pet-pack imports.
- `android.permission.WAKE_LOCK`, `android.permission.RECEIVE_BOOT_COMPLETED` — to resume the pet companion service after reboot.
- `android.permission.SYSTEM_ALERT_WINDOW` — only if the user enables the floating pet overlay; declared but not used by default in v1.
- Legacy `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` are auto-merged by the Expo `expo-media-library` / `expo-camera` AAR for SDK ≤ 32 backward-compat; the app's own manifest does not request them and they are unnecessary at targetSdk 34.

### Google Play "Data safety" section — suggested answers

For each Play Console question, the corresponding answer based on this form:

- **Does your app collect or share any of the required user data types?**
  → **Yes**, the app shares **Messages** (chat prompts) with the AI provider the user configures, and stores **App activity** (pet state, permissions, chat history) on device.
- **Is all of the user data collected by your app encrypted in transit?**
  → **Yes**, when the user supplies an `https://` provider baseURL (recommended). If the user configures a plain `http://` local endpoint (e.g., Ollama on-device), the connection is unencrypted by the user's choice.
- **Do you provide a way for users to request that their data is deleted?**
  → **N/A** — no account, no server-side data. In-app "reset workspace" and uninstall remove all on-device data.
- **Is your app designed for children?**
  → **No** — general audience / developer preview.
- **Data categories that apply:** App activity (in-app messages, app interactions, user-generated content) — stored on device, shared to user-configured provider on user action.

---

## How this was verified

- `aapt2 dump badging` on the local debug APK → permission list and package metadata (see `docs/PUBLISH_REMEDIATION_PLAN_2026-09-01.md` Turn 6).
- Source grep across `apps/mobile` and `packages`:
  - `fetch(` calls limited to `packages/core/src/ai-manager.ts` against user-configured provider baseURLs.
  - **No** matches for `analytics`, `crashlytics`, `FirebaseAnalytics`, `getMessaging`, `telemetry`, `track(`.
  - **No Firebase or other third-party tracking SDKs.** v1 uses local notifications only (expo-notifications, local API) — remote push is intentionally not enabled, so no Firebase project, google-services.json, GoogleService-Info.plist, or Firebase Analytics/Crashlytics init is shipped. The `com.google.android.c2dm.permission.RECEIVE` permission in the APK is a library-level declaration from `expo-notifications` and does not connect to any Firebase project.
- `scripts/verify-android-apk.sh` → APK artifact present and well-formed.

## Open items before final submission

- [ ] Confirm the Google Play Console "Data safety" preview matches the language above.
- [ ] If the app ever ships a server-side feature, re-do this form and add the corresponding data categories and security practices.
- [ ] Re-run `aapt2 dump permissions` against the **release** AAB (after EAS produces it) to confirm the permission list is identical to the debug build.
- [x] **Turn 11:** Removed all Firebase wiring (`expo-firebase-core` plugin, `withFirebaseInit` local config plugin, `expo-build-properties` `googleServicesFile`, the `apply plugin: "com.google.gms.google-services"` line, the Firebase BoM dep, the `com.google.gms.google-services` Gradle classpath, the `google-services.json` file, and the `GoogleService-Info.plist` file) and the `expo-firebase-core` package.json dep. The app no longer references a developer's Firebase project. The `com.google.android.c2dm.permission.RECEIVE` permission in the APK is a library-level declaration from `expo-notifications` and does not connect to any Firebase project.
