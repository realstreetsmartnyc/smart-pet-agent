# Mobile Trust — iOS / Android (Sprint 5)

## Permission Mapping (OS prompts, deny-by-default)
- `camera` → iOS `AVCaptureDevice` / Android `android.permission.CAMERA` → core `camera` (ask/allow/deny)
- `microphone` → iOS `AVAudioSession` / Android `RECORD_AUDIO` → core `microphone`
- `notifications` → iOS `UNUserNotificationCenter` / Android `POST_NOTIFICATIONS` → core `notifications` (no overlay on mobile, notification+widget instead)
- `biometrics` → iOS `LocalAuthentication` / Android `BiometricManager` → core `biometrics` (future scope)

## Audit Parity
Every `MOBILE_PERMISSION_MAP` request logs `mobile:<device>:<action>` with same `MemoryStore.logAudit` shape as desktop `computer_action`. Query via `audit:list`.

## Store Gates (Sprint 5)
- `apps/mobile/app.json` bundle `ai.smartpet.agent` (iOS `buildNumber 1` / Android `versionCode 1`), `NSCameraUsageDescription` etc., `POST_NOTIFICATIONS`.
- Icons/screenshots: reuse `apps/electron/assets/icon.png` placeholder → real 1024x1024 for TestFlight/Play.
- Track: `v1.1.0-mobile-beta` closed track (TestFlight internal / Play Internal Track) — no public review until `v1.0.0` desktop publish-green.

## Verification
- `bash scripts/mobile-smoke.sh` → `mobile-smoke GREEN` (RuntimeEvent v1 + validator + MOBILE_CAPABILITIES)
- `node --import tsx -e "import {MOBILE_PERMISSION_MAP} from './apps/mobile/src/permissions.ts'; console.log(MOBILE_PERMISSION_MAP)"` → map present
