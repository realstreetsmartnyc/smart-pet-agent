# Support — Smart Pet Agent

## Getting Help

- **GitHub Issues:** https://github.com/smart-pet-agent/smart-pet-agent/issues
- **Email:** support@streetsmartnyc.cloud
- **Docs:** See `docs/` for onboarding, trust, and release notes

## Before You Report

1. Update to the latest version.
2. Restart the app.
3. Check `KNOWN_ISSUES.md` for your problem.
4. Collect logs:
   - **Desktop:** `~/.smart-pet-agent/logs/runtime.log`
   - **Mobile:** `adb logcat | grep smart-pet-agent` or Expo dashboard logs

## Privacy

- Chat history and permissions are stored locally on your device in SQLite.
- No data is sent to external servers unless you configure an AI provider (Nous, OpenAI, Ollama, etc.).
- Camera, microphone, and screen access are only used when you explicitly grant permission.
- See `docs/TRUST.md` for the full trust model.

## Security

- Report security vulnerabilities via GitHub Security Advisories (private).
- Do not open public issues for security bugs.

## Roadmap

- **v1.0.0** (current): Desktop overlay pet, chat, permissions, Windows/macOS/Linux installers
- **v1.1.0-mobile-beta**: Android/iOS beta with real-time chat and pet rendering
- **Future:** Voice TTS/STT, custom pet packs, marketplace, 3D companion rooms

## Contributing

See `CONTRIBUTING.md` for development setup, branch strategy, and PR requirements.
