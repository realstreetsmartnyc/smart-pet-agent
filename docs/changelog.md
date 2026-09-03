# Changelog

> Sourced from `CHANGELOG.md` at repo root — see also `docs/RELEASE_NOTES_*`.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows Semantic Versioning once public releases begin.

## [Unreleased] - Private Alpha / Technical Preview

### Added

- Desktop overlay pet with canvas orb rendering and 11 semantic intents.
- NYC-branded Electron chat/dashboard, overlay, and pet bubble surfaces.
- Runtime event contract v1 for agent status, chat streaming, permissions, pet intent, tasks, and history.
- Multi-provider AI manager and local/provider fallback scaffolding.
- Permission service and audit model for explicit computer/peripheral use.
- Peripheral manager with Linux, Windows, and macOS adapter branches.
- Voice state scaffold for future TTS/STT integration.
- Pet pack validator and default `default-nyc-orb` canvas pet pack.
- Mobile Expo scaffold for future Android/iOS companion work.
- Custom pet creator scaffolding for description/image-based pet generation.
- Marketing, exposure, and master execution plans for private-alpha launch prep.

### Changed

- Unified visible product direction around `Smart Pet Agent` by Street Smart NYC.
- Updated publish planning to distinguish verified source work from packaged artifact readiness.
- Hardened SQLite production expectations so in-memory fallback is explicit test/diagnostic behavior only.
- Improved packaged-runtime diagnostics and source-level native SQLite persistence checks.

### Fixed

- Cwd-independent Electron agent runtime bundle generation.
- Renderer global declaration collisions found during packaged Electron testing.
- Source-level tests and typecheck regressions found during Sprint 3 hardening.

### Not Yet Released

- No `v1.0.0` public release has been cut from the current evidence.
- Public desktop installers are not publish-ready until packaged Electron native SQLite, persistence, IPC, and platform installer gates pass.
- Mobile remains a scaffold/beta-track target, not an app-store-ready product.
- Custom pet generation remains an MVP workstream until safe image ingestion, validation, install, activation, export/import, and rollback are verified.

## [0.1.0] - 2026-08-30

### Added

- Initial prototype with core runtime.
- Basic Electron shell.
- SQLite-backed memory store foundation.
- Permission model foundation.
- NYC brand tokens.
