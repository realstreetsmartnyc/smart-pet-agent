# PetClaw 0.1.3 — Reverse Engineering Report
> Source: `/home/ssmartnycbase/Downloads/PetClaw-Setup-0.1.3.exe` (249 MiB, NSIS 3 Unicode, PE32)
> Extracted: `/tmp/petclaw-extract` + `/tmp/petclaw-src` (asar unpacked)
> Date: 2026-08-30 | Tomoe Analysis

---

## 1. Installer Structure

```
PetClaw-Setup-0.1.3.exe (NSIS)
 ├── $PLUGINSDIR/app-64.7z (260M LZMA2, 489M unpacked)
 │    ├── PetClaw.exe (169M - Electron main)
 │    ├── chrome_*.pak, d3dcompiler, ffmpeg.dll, libEGL/GLESv2, vk_swiftshader
 │    ├── resources/
 │    │    ├── app.asar (45M) ← MAIN APP
 │    │    ├── app.asar.unpacked/app-main/resources/{node,openclaw}/win32-x64.zip
 │    │    ├── app-update.yml (generic provider → https://petclaw.ai)
 │    │    ├── elevate.exe
 │    │    └── skills/ (42 bundled skills)
 │    └── locales/
 └── $R0/Uninstall PetClaw.exe
```

**package.json**
```json
{
  "name": "petclaw",
  "version": "0.1.3",
  "main": "app-main/main.js",
  "dependencies": { "bytenode": "^1.5.7", "electron-updater": "^6.3.9", "ws": "^8.19.0", "marked": "^17.0.5", "mammoth": "^1.12.0", "html-to-docx": "^1.8.0", "xlsx": "^0.18.5" }
}
```

**Build obfuscation**: All critical logic in `.jsc` (Bytenode V8 bytecode). Plain `.js` are 1-line shims: `require('bytenode'); module.exports=require('./x.jsc')` — reverse requires Node bytenode loader matching Electron's V8 version (failed on Node 24, needs Electron's node).

---

## 2. App Architecture - Electron Multi-Window

| Window | File | Purpose | Props (from main.jsc strings) |
|--------|------|---------|-------------------------------|
| **Pet Overlay** | `dist/index.html` → `pet-Dyf9cZVx.js` | Always-on-top transparent desktop pet | `transparent:true, frame:false, alwaysOnTop:true, skipTaskbar:true, hasShadow:false`, workArea bounds, width/height ratios, margin |
| **Pet Bubble** | `dist/pet-bubble.html` → `petBubble-CX7i8i4j.js` | Thought/tool bubble above pet (106x98 max) | Anchored bottom-left, tail pointer, auto-hide 7s after done |
| **Chat/Dashboard** | `dist/chat.html` → `chat-DKB5i9mp.js` | Full app UI: chat, skills, tasks, channels | `background:#f8f8fa` light / `#09090b` dark, sidebar 240px, window chrome controls |
| **Updater** | `updater.jsc` + `app-update.yml` | Auto-update generic | `provider: generic, url: https://petclaw.ai` |

**Main process files** (`app-main/`):
- `main.jsc` (52K, Bytenode) - BrowserWindow creation, tray, lifecycle
- `pet-behavior.jsc` (15K) - patrol, sleep, drag, cursor tracking
- `petclaw-brain.jsc` (143K) - gateway orchestration
- `openclaw-client.jsc` (40K) - WS gateway client
- `ipc-handlers.jsc` (204K) - ALL IPC (321-line preload maps to this)
- `store.jsc` (5.3K) - electron-store
- `skill-manager.jsc` (53K) - skill lifecycle
- `channel-manager.jsc` (27K) - Telegram/Feishu adapters
- `tracker.jsc` (2.4K) - analytics
- `preload.js` (16K, PLAIN) - full API surface: see §3

---

## 3. Preload API Surface (electronAPI) - 321 lines

### Pet Window
```js
toggleChat(), showContextMenu()
onAnimState(cb), animStateChanged(state), onPoseChange(cb), onCursorPosition(cb), onDirectionChange(cb)
setIgnoreMouse(ignore) // click-through when not hovering pet
rapidClick() // 3 clicks in 500ms → toggleChat fast path
startDrag(screenX, screenY), dragMove(x,y), stopDrag()
onVoiceTranscribing(cb), onVoiceForceCancel(cb)
```

### Chat / Gateway (OpenClaw)
```js
sendMessage({sessionKey, message, uploadedFiles, runtimeMode, modelOverride, skillFilter, skillDisplayText, devSystemPrompt})
getChatHistory(sessionKey), abortChat(sessionKey), getSessions(), deleteSession(), renameSession()
getGatewayHealth(), getSessionTokenUsage(sessionKey)
onAIChunk, onAIDone, onAIError, onApiError, onAITool, onAIRunStart, onAIFinal, onCompactionStatus
onGatewayStatus, onBrainStatus, onBrainStep
triggerBootstrap(), getBootstrapIssue(), repairRuntime()
```

### Pet Lifecycle
```js
petAppear(), checkWindowShown(), getChatWindowState(), setChatWindowLayout(mode), setPetVisibility(bool)
minimizeChatWindow(), toggleMaximizeChatWindow(), closeChatWindow()
onWindowShown(cb), onWindowStateChanged(cb)
```

### Voice
```js
checkMicrophone(), requestMicrophone(), updateVoiceShortcut(keys)
transcribeAudio(arrayBuffer)
voiceStart() // plays wake.MP3 + ipc voice-start
voiceConfirm() // plays down.MP3 + voice-confirm
voiceCancel()  // plays down.MP3 + voice-cancel
voiceTranscribing(active)
onVoiceShortcut(cb)
```

### Skills
```js
skillsList(), skillsInstall(id), skillsUninstall(id), skillsInstallUrl(id,url,meta), skillsInstallContent(id,content,meta)
skillsEnable/Disable/Verify/GetConfig/SaveConfig(id), skillsReveal(path)
skillsGetInstallCommands(id), skillsRunInstallCmd(id,cmd), skillsRecheckEligibility(id)
onSkillsInstallProgress, onSkillsBgProgress, onSkillsListUpdated
```

### Tasks / Channels / Auth / Settings (see preload.js §295-321)

---

## 4. Pet UI - Video-Driven State Machine

**From `voice-DuauicYA.js` (plain, extractable):**
```js
const STATES = {
  begin:        {src:"begin.webm",       loop:false, next:"static"},
  static:      {src:"static.webm",      loop:true},
  listening:   {src:"listening.webm",   loop:true, waitOnExit:true},
  "task-start":{src:"task-start.webm",  loop:false, next:"task-loop", waitOnExit:true},
  "task-loop": {src:"task-loop.webm",   loop:true,  waitOnExit:true},
  "task-leave":{src:"task-leave.webm",  loop:false, next:"static"},
  "sleep-start":{src:"sleep-start.webm", loop:false, next:"sleep-loop"},
  "sleep-loop":{src:"sleep-loop.webm",  loop:true},
  "sleep-leave":{src:"sleep-leave.webm", loop:false, next:"static"},
}
```

**Pet container (`pet-Dyf9cZVx.js` plain):**
- `width:100vw height:100vh` transparent, `cursor:grab` → `grabbing` on drag
- Central `pet-body` with `drop-shadow(0 4px 8px rgba(0,0,0,0.15))`
- `pet-video` (`<video muted playsInline>`) 100% contain, driven by animState
- `pet-waveform` overlay: 12-bar freq analyser (AnalyserNode fftSize 256, smoothing 0.22, gradient white)
- `pet-thinking` pill: `rgba(10,10,10,0.94)`, blur 24px, shimmer gradient animation 1.8s
- Drag: `B=.62` (62% hitbox centered), screenX/screenY tracking, RAF dragMove, stale 250ms debounce
- Rapid click: 3 clicks <500ms → `rapidClick` IPC

**Pet behavior (`pet-behavior.jsc` strings):**
- `patrolInterval`, `patrolDirection`, `patrolSpeed`, `cursorPollInterval`, `sleepCheckInterval`, `SLEEP_TIMEOUT`, `DRAG_STALE_TIMEOUT_MS`
- `isMouseOverPet` / `isCursorOverPet` via `getPetHoverBounds` + `getCursorScreenPoint` + `getDisplayMatching(petDisplayId)`
- `setIgnoreMouseEvents(!isMouseOverPet)` → click-through when not over pet (key for overlay while gaming/watching)
- `patrol` (idle wander), `sleep` after `lastActivityTime` timeout

**Bubble** (`petBubble-CX7i8i4j.js` plain):
- `bubble-root` fixed inset 0, flex end, padding 0 0 4px 8px (anchors above cat's transparent top zone)
- `bubble` 106x98 max, `rgba(14,14,16,0.95)`, radius 11/11/11/3, tail clip-path polygon
- Tool chips: done=green `#4ade80`, running=blue `#60a5fa` pulse, dot anim
- Lifecycle: `ai-run-start` → clear, `ai-chunk` → stream, `ai-tool` → chips, `ai-done` → auto-hide 7s, `ai-final` → content

**Audio**: `wake.MP3` (voiceStart), `down.MP3` (confirm/cancel), Web Audio API for listening viz

---

## 5. Workspace & Agent Rules

**Templates** (`app-main/workspace-templates/`):
- `AGENTS.md`, `SOUL.md`, `AGENTS_CHAT.md`, `AGENTS_WORK.md`

**SOUL.md** (user-editable personality):
- Default name PetClaw, tone warm/not fawning, fun/not over-top, smart/not showy, tsundere cat hint

**AGENTS.md** (32 rules):
- Startup: read SOUL.md, USER.md, memory.md
- Memory: `memory.md` durable, files > chat history
- Red lines: no exfil, no destructive without confirm, pause if unsure
- Skill priority: check installed skill/tool first before manual
- Skill creation: creator → auditor → save only if safe/low-medium
- Safety: explain failures plainly, never silent skip

**Brain**: `petclaw-brain.jsc` (143K) → gateway health, pairing URL, SOP steps (`check→gateway→connect`), bootstrap repair

---

## 6. Skills (42 bundled)

`resources/skills/` → xiaohongshu, whatsapp-notify-hub, webapp-testing, wacli, task-scheduler, stock-analysis, skill-creator/auditor, reelforge, meetily, mcp-builder, literature-search, kol-screening/outreach, gmail-operator, frontend-design, find-bugs, email-monitor-cron, deep-research, data-analyst, code-reviewer, cat-health-manager, calendar, byte-rover, brainstorming, baoyu-infographic, ai-news, ai-financial-coach, ai-movie-production-agent, algorithmic-art + 10 more

Each: `SKILL.md` + scripts, install via `skills:install` / bg-install with brew checks

---

## 7. Template Value for Smart-Pet-Agent

**What to replicate 1:1 (UI template):**
- Transparent `BrowserWindow` (alwaysOnTop, frameless, skipTaskbar, hasShadow false, ignoreMouseEvents)
- Pet overlay + bubble + chat 3-window pattern
- Video state machine (or replace webm with custom pet rig — same IPC `anim-state`)
- Drag/rapidClick/patrol/sleep behaviors
- `preload.js` shape: `electronAPI` bridge kept, but point `sendMessage` to OUR agent-loop, not OpenClaw gateway
- Bubble lifecycle: streaming chunks → chips → auto-hide

**What to replace with OWN agent OS:**
- `main.jsc` → rewrite in Rust/Tauri or Electron plain JS (no bytenode)
- `petclaw-brain` / `openclaw-client` (gateway) → `packages/core/agent-loop.ts` (multi-provider: Ollama/LiteLLM/OpenAI/Anthropic/Google/custom + delegation to Hermes/Codex/Gemini/OpenCode/Vibe)
- `store.jsc` → SQLite memory + personality evolution
- `pet-behavior` patrol random → thought-driven (agent decides walk/fly/dance based on reasoning, not timer)
- Add: computer-use (CDP + xdotool), peripherals (camera/mic via permissions), TTS/STT (Piper/Whisper), WASM plugin sandbox, Stripe marketplace

**Result**: Same delightful overlay UX users love about PetClaw, but the brain is Smart-Pet-Agent — does everything for you while you game/watch, custom pets swappable via spec below.

---

*Extracted via 7z + asar on Parrot Linux. Bytenode blocks deep main/brain logic — remaining UX fully reverse-engineered from plain dist + preload strings.*
