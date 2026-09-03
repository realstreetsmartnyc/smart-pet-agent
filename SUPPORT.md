# Support — Smart Pet Agent

Smart Pet Agent is **v1.0.0 public** — Linux AppImage/deb, CLI, TUI, and Android APK are verified. Windows and macOS installers are source + CI ready (pending signing secrets). See `docs/PUBLIC_RELEASE_CHECKLIST_2026-09-02.md` for gate status and `docs/PUBLISH_RUNBOOK_v1.0.0.md` for artifact reproduction.

## Getting Help

- GitHub Issues: https://github.com/realstreetsmartnyc/smart-pet-agent/issues
- Email: support@streetsmartnyc.cloud
- Docs: see `docs/` for onboarding, trust, publish status, and release planning

## Before You Report

1. Confirm whether you are using a source build, a packaged `v1.0.0` release artifact, or a development build.
2. Restart the app and capture the exact failure point.
3. Check `KNOWN_ISSUES.md` for the current blocker list.
4. Collect relevant logs without including secrets, API keys, private files, images, or recordings.

## Privacy

- The product goal is local-first memory and explicit permission-gated computer/peripheral use.
- No external AI provider should be contacted unless the user configures one.
- Camera, microphone, screen, mouse, keyboard, file, browser, and app actions must remain visible and permission-gated.
- See `docs/TRUST.md` for the trust model.

## Security

- Report security vulnerabilities privately via GitHub Security Advisories when available.
- Do not open public issues for security bugs, secrets, private logs, or sensitive device captures.

## Roadmap Status

- Current: **v1.0.0 public** — Linux desktop (AppImage + deb, e2e GREEN), CLI/TUI, Custom Pet Creator MVP, and Android debug APK verified. See `docs/PUBLIC_RELEASE_CHECKLIST_2026-09-02.md` for the full gate table.
- Next: signed Windows NSIS + macOS DMG (pending `WIN_CSC_LINK` / `CSC_LINK` secrets), EAS/Play Internal for Android, and marketplace/pet-store hardening.
- Later: iOS (needs Apple Developer account), real voice integration, advanced 3D pet formats, and broader agent federation.

For the current execution map, see `docs/PUBLIC_RELEASE_CHECKLIST_2026-09-02.md`.
