# Smart Pet Agent v1.0.0 Release Notes

## 🎉 v1.0.0 — Initial Public Release

Smart Pet Agent is now publicly available as a **MIT-licensed, open-source** AI pet companion. This release marks the project's graduation from private alpha / technical preview to a fully shipable v1.0.0 product.

### ✅ What's Shippable (v1.0.0)

| Platform | Artifact | Status |
|---|---|---|
| **Linux** | AppImage + deb | ✅ Verified — both install and reach `agent.ready`; E2E GREEN |
| **CLI** | `smart-pet` (CJS, 97 KB) | ✅ All 11 commands working; `pnpm cli "Hello, Smart!"` |
| **TUI** | `smart-pet-tui` (ESM, 2.1 MB) | ✅ TTY terminal interface operational |
| **Desktop Electron** | Linux (AppImage/deb) | ✅ Packaged boot verified; native SQLite ABI 130; chat IPC; permissions |
| **Android** | Debug APK | ✅ Built and `apksigner` PASS; EAS/Play Internal pending secrets |
| **macOS** | DMG (CI-ready) | ✅ Build configured on `macos-latest`; `CSC_LINK` secret pending |
| **Windows** | NSIS .exe (CI-ready) | ✅ Build configured on `windows-latest`; `WIN_CSC_LINK` secret pending |

### ✅ Runtime & Technical

- **Multi-provider AI**: 21 LLM providers (Ollama, OpenAI, Anthropic, Google, LiteLLM, etc.)
- **Native SQLite persistence**: Rebuilt for Electron ABI 130; verified write/reopen cycle
- **RuntimeEvent v1 NDJSON protocol**: Agent status, chat streaming, permissions, pet intent, tasks, history
- **Permission service**: Per-action validation + audit logging (`logAudit`)
- **Overlay & bubble surfaces**: NYC-branded, 6 pages (chat/tasks/devices/permissions/pets/settings)
- **Custom pet platform**: `.smartpet` format with default `default-nyc-orb` pack
- **CLI commands**: 11 commands including `help`, `state`, `memory`, `permissions`, `grant`, `revoke`, `delegate`
- **IPC surfaces**: provider test/activate, setActivePet, notifyPetSwitch wired

### ✅ Open-Source & Community

- **MIT License**: Full code, docs, and assets freely usable, modifiable, distributable
- **Code of Conduct**: Contributor Covenant 2.1 enforced via `.github/CODEOWNERS`
- **Funding links**: GitHub Sponsors, Open Collective, Ko-fi (`.github/FUNDING.yml`)
- **Issue/PR templates**: bug_report, feature_request, security_report, PULL_REQUEST_TEMPLATE
- **Contributing guide**: `CONTRIBUTING.md` with Conventional Commits, gate checks, no-baked-credentials rule

### ✅ Monetization (post-v1.0.0 pathway)

- **Donations/sponsorships**: GitHub Sponsors + Open Collective + Ko-fi (optional, additive)
- **Premium pet packs**: Q1 2026+ — `.smartpet` format store (not paywalled in open-source build)
- **Managed cross-device sync**: Q2 2026+ — hosted backend, encryption key stays on user device
- **Premium support**: Organization contracts (anytime after v1.0.0)

### ✅ What Has Not Changed

- No telemetry, no advertising, no tracking — local-first privacy posture preserved
- No feature is paywalled in the open-source MIT build
- No dual-license, no copyleft, no "non-commercial" clauses
- Users supply their own AI provider keys at runtime (BYOK model)
- Core remains 100% MIT-licensed and free

### 📦 How to Install

```bash
# Linux (AppImage)
curl -L https://github.com/realstreetsmartnyc/smart-pet-agent/releases/download/v1.0.0/smart-pet-agent.AppImage > smart-pet-agent.AppImage
chmod +x smart-pet-agent.AppImage
./smart-pet-agent.AppImage

# Or via deb
sudo dpkg -i smart-pet-agent_1.0.0_amd64.deb

# CLI
pnpm --filter @smart-pet/cli build
npm link smart-pet  # or: pnpm exec smart-pet "Hello, Smart!"

# Mobile (debug)
# See docs/MOBILE_BUILD.md for EAS build instructions
```

### 🙏 Acknowledgements

Built by the Street Smart NYC community. Special thanks to all contributors, testers, and early adopters who helped graduate this project from private alpha to v1.0.0.

---

*Smart Pet Agent v1.0.0 — © 2026 Smart Pet Agent Contributors. MIT License.*
