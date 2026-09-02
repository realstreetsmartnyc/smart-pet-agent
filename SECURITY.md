# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `master` (unreleased) | :white_check_mark: |
| latest release tag | :white_check_mark: |
| any older tag | :x: |

## Reporting a vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Email `security@streetsmartnyc.cloud` with:

- A clear title, e.g. `[Security] <short summary>`.
- The affected version(s).
- Steps to reproduce, including any proof-of-concept if you have one.
- Whether you want public credit.

We will acknowledge within **3 business days** and aim to fix or publish a
mitigation within **90 days**.

## What counts as a security issue

- Code execution / injection in the desktop, CLI, TUI, or mobile runtime.
- Path traversal or arbitrary file read/write in the Custom Pet Creator
  (`.smartpet` import, pet workspace, image ingestion).
- Any way to exfiltrate user data (chat history, permissions, pet state)
  beyond the AI provider endpoint the user explicitly configured.
- Any bundled credential, API key, or third-party project connection.

## What does NOT count

- A user configuring a hostile AI provider endpoint and sending it their own
  prompts — that is the user's explicit choice and is outside our threat model.
- Missing OS-level sandboxing (the app is local-first and runs with the user's
  own privileges).
