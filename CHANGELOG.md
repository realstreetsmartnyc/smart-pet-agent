# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Alpha / Technical Preview

### Added
- Desktop overlay pet with canvas orb rendering and 11 intents (including planning)
- Branded chat/dashboard with NYC Street Smart tokens (`tokens.css`)
- Pet bubble overlay with smoked-glass aesthetic
- Runtime event contract v1 (NDJSON IPC bridge)
- Multi-provider AI manager with fallback chain (Nous, OpenAI, Ollama, etc.)
- Permission service with durable SQLite persistence
- Peripheral manager with platform adapters (Linux, Windows, macOS)
- Voice scaffold with `voice.state` halo wiring
- Onboarding banner and first-run flow
- Pet pack validator (`validatePetPack`) with asset checks
- Windows NSIS installer support
- macOS DMG packaging
- Linux AppImage + deb packaging
- CI workflow with typecheck, tests, smoke, mobile-smoke, and e2e-electron
- Mobile scaffold (`apps/mobile`) with Expo/React Native
- `expo-sqlite` memory adapter for mobile
- React Native RuntimeEvent bridge (`useRuntimeEvents`)
- Mobile permission flows (camera, microphone, notifications, biometrics)
- Mobile smoke tests and standalone export script

### Changed
- Unified branding to "Smart Pet Agent" across all surfaces
- SQLite schema shared between desktop (`better-sqlite3`) and mobile (`expo-sqlite`)
- Permission model deny-by-default with explicit grant/revoke flows
- Chat streaming emits word-level `chat.chunk` events with provider identity
- Overlay pet supports drag and click-through (`setIgnoreMouse`)

### Fixed
- Native binding rebuild for `better-sqlite3` on Linux
- Permission persistence across app restarts
- Spawn injection safety (single-arg + size guards)
- Windows audio capture with explicit failure paths

### Security
- Per-action validation with `validateComputerAction`
- Audit logging for all permission changes and computer actions
- Destructive actions list empty for v1 (`DESTRUCTIVE_ACTIONS = []`)
- Capability probes for screen, camera, and microphone

### Documentation
- Trust docs (`docs/TRUST.md`)
- Onboarding guide (`docs/ONBOARDING.md`)
- Publish-ready execution plan (`docs/PUBLISH_READY_EXECUTION_PLAN_2026-08-30.md`)
- Mobile build guide (`MOBILE_BUILD.md`)

## [0.1.0] - 2026-08-30

### Added
- Initial prototype with core runtime
- Basic Electron shell
- SQLite-backed memory store
- Permission model foundation
- NYC brand tokens
