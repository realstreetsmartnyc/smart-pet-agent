# Smart Pet Agent v1.0.0 Release Notes Draft

Status: draft only. Do not publish.

This file is preserved as a release-notes placeholder, not as proof that `v1.0.0` exists. Smart Pet Agent is currently private alpha / technical preview. Public `v1.0.0` release notes must be rewritten after desktop artifact gates pass.

## Current Alpha Highlights

- Standalone Smart Pet Agent product direction by Street Smart NYC.
- NYC-branded Electron overlay, dashboard, and pet bubble surfaces.
- Default `default-nyc-orb` canvas pet pack with semantic intent mapping.
- Runtime event contract for status, chat, permissions, pet intents, tasks, and history.
- Permission-gated computer/peripheral action model and audit direction.
- CLI/TUI/mobile scaffolds for multi-surface expansion.
- Custom pet creator workstream for future image/description-based pet generation.

## Not Yet Release-Ready

- Packaged Electron native SQLite must be rebuilt and verified for Electron ABI `130`.
- Packaged permission persistence must pass in production runtime.
- Packaged chat IPC, permission IPC, overlay, restart persistence, logs, and pet activation must pass clean E2E.
- Linux, Windows, and macOS installers must be built and exercised in clean target environments.
- Public docs and support copy must match verified release evidence.
- Mobile store releases are deferred.
- Custom pet generation remains a gated MVP workstream.

## Release Notes Completion Gate

Before this file can become real public `v1.0.0` release notes:

- `docs/RELEASE_CHECKLIST.md` must be green for the selected desktop platforms.
- Installer artifacts and checksums must exist.
- Known issues must be accurate for the shipped build.
- Installation, upgrade, launch, restart, and uninstall evidence must be recorded.
- The user must explicitly approve the release, tag, and publication.
