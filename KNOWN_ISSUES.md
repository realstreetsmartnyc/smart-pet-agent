# Known Issues — Smart Pet Agent Private Alpha

This file tracks known limitations, workarounds, and planned fixes for the current private-alpha / technical-preview state. It is not a public release note.

## Desktop

### Public installers are not release-ready

- Packaged Electron still needs a production `better-sqlite3` rebuild for Electron `33.4.11` ABI `130`.
- Production packaged SQLite permission persistence has not passed the final runtime gate.
- Real packaged chat IPC, permission IPC, overlay behavior, restart persistence, logs, and pet activation still need clean artifact verification.
- Linux AppImage/deb, Windows NSIS, and macOS DMG must be built and exercised on clean target environments before public release.

Workaround: use development or controlled alpha builds only.

### Voice is a scaffold

- `generateVoice` and `transcribeAudio` are not complete production TTS/STT integrations.
- Voice state UI wiring may be present, but real provider/device behavior remains future work.

Workaround: use text chat while voice providers are wired and verified.

### Custom pet creator is partial

- Description/image-to-pet generation is planned and partially scaffolded.
- Safe image ingestion, MIME/signature validation, lifecycle IPC, atomic install, activation, export/import, and rollback still need completion.

Workaround: use the default `default-nyc-orb` pet pack until custom pet gates pass.

### Tauri desktop shell is not the release target

- `apps/desktop` exists as a Tauri/Rust visual or bridge prototype.
- The release candidate path is currently Electron-first.

Workaround: use Electron for desktop release work.

## Mobile

### Android/iOS are not store-ready

- `apps/mobile` is a scaffold/beta-track target.
- Device permission tests, real mobile runtime wiring, EAS project registration, Play Internal, and TestFlight evidence remain open.

Workaround: treat mobile as post-desktop work.

### Store credentials are external blockers

- Android release signing and Google Play Console setup are required before Play distribution.
- Apple Developer Program access is required before TestFlight/App Store distribution.

Workaround: defer store claims until accounts, signing, builds, and device tests are verified.

## Documentation

### Historical sprint reports may overstate readiness

- Older Sprint 4/5 notes and release-note drafts are historical development evidence only.
- The controlling current plans are `docs/MASTER_PHASE_SPRINT_EXECUTION_PLAN_2026-09-01.md` and `docs/PUBLISH_PLAN_ALL_PLATFORMS_2026-09-01.md`.

Workaround: use current controlling plans for release decisions.

## Reporting Issues

- Include OS, app surface, command or installer used, and steps to reproduce.
- Desktop logs, when available, should come from the Smart Pet Agent runtime log path shown by the app or packaged test output.
- Do not include secrets, API keys, camera images, microphone recordings, or private files in public reports.
