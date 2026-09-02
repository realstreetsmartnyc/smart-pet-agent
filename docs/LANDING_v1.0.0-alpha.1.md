# Smart Pet Agent — Private Alpha (Linux + Android)

> **Private alpha / technical preview.** Ready for early evaluation by developers and design partners. Not a public 1.0.0 launch — iOS, signed Windows, signed macOS, and store listings are still in progress.

## What is Smart Pet Agent?

A local-first AI companion that lives on your desktop and phone. Configure your own AI provider (local Ollama, hosted OpenAI-compatible endpoint, or any LiteLLM-routed service), chat with a custom pet, and keep your conversations, permissions, and pet state entirely on your device.

Smart Pet Agent does not phone home. It does not collect analytics. It does not require an account. The AI calls go to the baseURL you configure in Settings, with the API key you supply.

## What's in this alpha

| Platform | Artifact | Size | Install |
|---|---|---|---|
| Linux desktop (AppImage) | `Smart Pet Agent-1.0.0.AppImage` | ~107 MiB | `chmod +x` and run, no install |
| Linux desktop (deb) | `smart-pet-agent_1.0.0_amd64.deb` | ~75 MiB | `sudo dpkg -i` |
| Android (debug APK) | `app-debug.apk` | ~165 MiB | `adb install` (sideload) |
| Linux CLI | `smart-pet` v1.0.0 | 97 KB CJS | `pnpm cli` or run directly |
| Linux TUI | `smart-pet-tui` v1.0.0 | 2.1 MB ESM | `pnpm tui` (requires TTY) |

All artifacts: MIT-licensed. No bundled credentials, no third-party project connections.

## Privacy

- **Local-first.** Pet state, chat history, and permissions live in your device's private storage.
- **Your AI, your endpoint.** Configure the baseURL in Settings. Common patterns: local Ollama (`http://127.0.0.1:11434`), LiteLLM (`http://your-host:4000/v1`), any OpenAI-compatible endpoint with your API key.
- **No analytics, no crash reporting, no tracking SDKs.** The Android APK declares no Firebase, no Crashlytics, no Google Analytics. The `expo-notifications` library declares the `C2DM` permission at the library level; it does not connect to any project.
- **Data Safety form** is in `docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md` and matches the shipped behavior.

## What you can test

1. **Chat with local Ollama** — start `ollama serve`, open Settings in the app, set `baseURL=http://127.0.0.1:11434`, no API key. Chat.
2. **Chat with a hosted endpoint** — set your own baseURL + API key in Settings.
3. **Permission persistence** — grant/deny camera, mic, notifications, biometric. Restart the app. Permissions persist.
4. **Custom Pet Creator (MVP)** — describe a pet, generate, preview, validate, activate, list, export to `.smartpet`, import a `.smartpet`, rollback to the previous version. All on-device.

## What is not in this alpha

- **iOS** — pending Apple Developer enrollment and TestFlight setup.
- **Signed Windows installer** — the CI job is wired; the build will run on `windows-latest` when a CI run is triggered.
- **Signed/notarized macOS DMG** — the CI job is wired; the build will run on `macos-latest`.
- **Google Play / App Store listings** — no public store entry yet. Play Internal track is the next step for Android once the EAS + Play service account are configured.
- **Cloud sync, multi-device, account system** — not in scope for v1.0.0.

## Get the build

- GitHub releases: <https://github.com/<owner>/smart-pet-agent/releases/tag/v1.0.0-alpha.1>
- Source: `git clone https://github.com/<owner>/smart-pet-agent && git checkout v1.0.0-alpha.1`
- Build from source: `pnpm install --frozen-lockfile && pnpm --filter @smart-pet/desktop build:linux`

## Report issues

File at <https://github.com/<owner>/smart-pet-agent/issues>. Include OS + version (desktop) or device + Android version (mobile), the relevant log file, and steps to reproduce.

## License

MIT. See [`LICENSE`](LICENSE).
