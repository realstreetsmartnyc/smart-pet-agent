# Smart Pet Agent — User Guide

Welcome to **Smart Pet Agent** — the Street Smart NYC ambient AI companion. This guide covers install, setup, and daily use across desktop, CLI, TUI, mobile, pet packs, voice, and peripherals. For deep dives see `docs/`.

## 1. Installation

### Requirements

- **Node 20+** and **pnpm 9+** for building from source.
- **Linux** verified today; **Windows** and **macOS** installers are source + CI ready (pending signing secrets). Linux is the reference platform for v1.0.0.
- No account, no telemetry, no bundled AI credentials.

### From a Release (recommended)

Download the latest `v1.0.0` assets from [GitHub Releases](https://github.com/realstreetsmartnyc/smart-pet-agent/releases):

- **Linux AppImage**: `chmod +x "Smart Pet Agent-1.0.0.AppImage" && ./Smart\ Pet\ Agent-1.0.0.AppImage`
- **Linux deb**: `sudo dpkg -i smart-pet-agent_1.0.0_amd64.deb && smart-pet-agent`
- **Android APK** (sideload): `adb install app-debug.apk` — debug-signed for evaluation
- **CLI / TUI** bundles ship inside the release; or build them as below.

Checksums and `apksigner verify` evidence are in `docs/PUBLISH_RUNBOOK_v1.0.0.md`.

### From Source

```bash
git clone https://github.com/realstreetsmartnyc/smart-pet-agent.git
cd smart-pet-agent
pnpm install --frozen-lockfile

# Verify gates (must be GREEN before you file a PR)
pnpm typecheck
pnpm test            # 24/24
bash scripts/smoke.sh                # 7/7 SMOKE GATE GREEN
bash scripts/e2e-electron.sh         # packaged runtime GREEN
```

See `docs/ONBOARDING.md` for the first-run flow and `docs/PUBLIC_RELEASE_CHECKLIST_2026-09-02.md` for the full gate table.

## 2. Desktop App (Electron 33.4.11)

**Launch (dev)**: `pnpm --filter ./apps/electron run build:linux && ./apps/electron/dist/linux-unpacked/smart-pet-agent`
Or `pnpm dev` (uses `apps/electron/src/main.js` with `agent-runtime.mjs`).

**Windows on the desktop:** overlay pet, bubble chat, dashboard (`chat/tasks/devices/permissions/pets/settings`), tray, and NYC tokens (`packages/ui-tokens/tokens.css`). See `docs/PETS.md` for the orb's 11 intents.

**Data**: on-device SQLite (`better-sqlite3` ABI 130 in packaged build, in-memory fallback only in tests). No cloud sync unless you opt into the future managed sync (see `PRICING.md`).

**Trust**: `docs/TRUST.md` — deny-by-default peripherals, per-action `validateComputerAction`, `logAudit`, revocable grants.

## 3. CLI — `smart-pet`

Built as a self-contained CJS bundle (`apps/cli/dist/index.cjs`, 97 KB via esbuild).

```bash
pnpm --filter @smart-pet/cli build
node apps/cli/dist/index.cjs --help
node apps/cli/dist/index.cjs "Hello, Smart!"
node apps/cli/dist/index.cjs --interactive

# Inside the CLI
help | state | memory | permissions | grant <cap> | revoke <cap> | delegate
```

Provider config lives in SQLite; bring your own `baseURL` + key (see §7).

## 4. TUI — `smart-pet-tui`

Ink-based terminal UI (`apps/tui/dist/index.js`, ESM 2.1 MB).

```bash
pnpm --filter @smart-pet/tui build
node apps/tui/dist/index.js   # requires a real TTY
```

Shows prompt, streams `chat.chunk`/`chat.done`, falls back with a friendly message when not a TTY. Same `@smart-pet/core` runtime as desktop and CLI.

## 5. Mobile (Android + iOS)

- **Android**: `apps/mobile` (React Native / Expo SDK 51, `ai.smartpet.agent`, `targetSdk 34`). Local debug APK verified (`scripts/verify-android-apk.sh` + `apksigner`). EAS preview/production and Play Internal are pending `EAS_TOKEN`/`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`. See `MOBILE_BUILD.md` and `apps/mobile/README.md`.
- **iOS**: Expo managed, `bundleIdentifier ai.smartpet.agent`, camera/mic/photo InfoPlist strings. Deferred — needs Apple Developer Program ($99) + `ASC_API_KEY`. See `PUBLISH_READINESS_AUDIT_2026-09-01.md` lanes.

Mobile reuses `packages/core` via `apps/mobile/src/memory-mobile.ts` (`expo-sqlite`) and `useRuntimeEvents.ts`.

## 6. Pet Packs

Default pack is `pets/default-nyc-orb` (canvas orb, 11 intents, `preview.svg` 927 B, no fake `.webm`). Validation:

```bash
pnpm validate:pet
bash scripts/validate-pet.sh --checkAssets
```

Custom pets: see `docs/CUSTOM_PET_SPEC.md` (layout, `manifest.json`, `pet.config.json`, `rig.json`, hitbox/drag/patrol/sleep). Creator MVP (`packages/core/src/pet-creator.ts`) handles safe image ingest (MIME + magic-byte check), staging via `pet-workspace.ts`, `validatePetPack`, atomic activation + rollback, and `.smartpet` export/import. Import any `.smartpet` manually if you skip the future Pack Store.

## 7. Providers, Voice, Peripherals

**Bring your own AI provider** — Settings → Model Providers:

- Ollama: `http://127.0.0.1:11434`, no key
- LiteLLM: `http://host:4000/v1` + your key
- OpenAI-compatible: any `baseURL` + your key
- Anthropic / Google: your key

The app contacts only the `baseURL` you set. No bundled credentials (verified by the `no baked-in credentials` grep in `CONTRIBUTING.md`).

**Voice** (`packages/core/src/voice.test.ts`): TTS/STT/wake scaffolding is present; production provider wiring is still maturing — text chat is the reliable path today. See `KNOWN_ISSUES.md`.

**Peripherals** (`peripherals/` + `packages/core/src/peripheral-manager.ts`): camera, mic, screen, mouse, keyboard, apps/files/browser. Every action is permission-gated and audited. Grant/revoke in Settings → Devices or via CLI `grant`/`revoke`. Capabilities probe (`getSystemInfo().capabilities`) shows `unavailable` vs `ask` when hardware is missing.

## 8. Troubleshooting

- **Packaged boot fails (`dot-prop`/`conf`)**: rebuild — `node scripts/build-agent-runtime.mjs` then `electron-builder --linux`.
- **SQLite ABI mismatch**: `electron-builder install-app-deps` rebuilds `better-sqlite3` for ABI 130.
- **Android build**: `pnpm install` vs `npm install` workaround in `apps/mobile` (pnpm/Expo SDK 51 config), then `eas build --platform android --profile preview`.
- **Still stuck?** `SUPPORT.md` (support@streetsmartnyc.cloud) and `SECURITY.md` (security@streetsmartnyc.cloud). Check `KNOWN_ISSUES.md` first.

---

MIT © Smart Pet Agent Contributors. NYC-built, local-first, operator-owned. See `docs/` for runbook, monetization, data safety, and sprint plans.
