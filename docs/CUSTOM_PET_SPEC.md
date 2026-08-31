# Smart-Pet-Agent — Custom Pet Spec & Wiring
> How to add your own pet. Two paths: (A) follow the spec manually, (B) let the agent build it for you.

---

## A. Manual: Follow This Spec

### 1. Pet Package Layout

```
pets/my-pet/
├── manifest.json      # required - pet identity
├── assets/            # required - animations
│   ├── static.webm    # idle loop (or .mp4/.png sequence)
│   ├── begin.webm     # spawn
│   ├── listening.webm # voice listening
│   ├── task-start.webm / task-loop.webm / task-leave.webm
│   ├── sleep-start.webm / sleep-loop.webm / sleep-leave.webm
│   └── icons/         # tray, bubble tail, etc. (optional)
├── pet.config.json    # optional - override state machine
└── rig.json           # optional - for interactive pets (spine/lottie/three)
```

**Minimal viable pet**: 1 file `assets/static.webm` + `manifest.json` works. The app falls back `begin→static`.

### 2. manifest.json (required)

```json
{
  "id": "my-pet",
  "name": "My Pet",
  "version": "0.1.0",
  "author": "You",
  "description": "My custom desktop companion",
  "license": "MIT",
  "engine": "video",          // "video" | "spine" | "lottie" | "three" | "canvas"
  "preview": "assets/static.webm",
  "tags": ["cat", "cute"],
  "defaultState": "static"
}
```

### 3. pet.config.json (optional - full state machine override)

```json
{
  "states": {
    "begin":       { "src": "assets/begin.webm",       "loop": false, "next": "static" },
    "static":      { "src": "assets/static.webm",      "loop": true },
    "listening":   { "src": "assets/listening.webm",   "loop": true, "waitOnExit": true },
    "task-start":  { "src": "assets/task-start.webm",  "loop": false, "next": "task-loop", "waitOnExit": true },
    "task-loop":   { "src": "assets/task-loop.webm",   "loop": true, "waitOnExit": true },
    "task-leave":  { "src": "assets/task-leave.webm",  "loop": false, "next": "static" },
    "sleep-start": { "src": "assets/sleep-start.webm", "loop": false, "next": "sleep-loop" },
    "sleep-loop":  { "src": "assets/sleep-loop.webm",  "loop": true },
    "sleep-leave": { "src": "assets/sleep-leave.webm", "loop": false, "next": "static" }
  },
  "hitbox": 0.62,               // 0-1, centered clickable width (PetClaw uses 0.62)
  "ignoreMouseWhen": "notHover",// "notHover" | "never" | "always" (click-through)
  "draggable": true,
  "patrol": { "enabled": false, "intervalMs": 8000, "speed": 0.04 },
  "sleep": { "timeoutMs": 180000, "enabled": true },
  "cursorPollMs": 80,
  "rapidClick": { "count": 3, "windowMs": 500, "action": "toggleChat" }
}
```

If omitted, defaults match PetClaw extracted values above.

### 4. Wiring Into Smart-Pet-Agent

**Drop-in** (no code):

```bash
# 1. Copy pet folder to user pets dir
cp -r pets/my-pet ~/.smart-pet-agent/pets/my-pet

# 2. Or select in app: Settings → Appearance → Pet → "My Pet"

# 3. App hot-reloads: animState now drives your assets
```

**Programmatic** (agent loop):

```ts
// packages/core/src/agent-loop.ts already emits these:
agent.on('animState', (state) => {
  // state ∈ "begin"|"static"|"listening"|"task-start"|"task-loop"|"task-leave"|"sleep-*"
  // your engine plays assets[pet.config.json.states[state].src]
});

// Thought-driven override (Smart-Pet-Agent unique):
agent.on('thought', (reasoning) => {
  // Agent decided to dance because it celebrated your build success:
  if (reasoning.action === 'celebrate') pet.play('dance')
});
```

### 5. Supported Engines

| engine | Assets | Notes |
|--------|--------|-------|
| `video` | .webm/.mp4 | Simple, matches PetClaw exactly. Transparent VP9 webm recommended. |
| `lottie` | .json | Vector, tiny, scalable. Export from After Effects. |
| `spine` | .atlas/.json/.png | Bone rig, blend shapes for smile/talk/walk/fly. Best for thought-driven pets. |
| `three` | .glb/.gltf | Full 3D. For Lyra-style companion with room. |
| `canvas` | JS | Custom draw (use `packages/core/animation-controller.ts` API). |

**Recommended for your use-case** (always-on while gaming/watching): `video` for v1 (fastest, matches template), `spine` for v2 (thought-driven walk/fly/smile).

### 6. Packaging for Marketplace (OpenCore)

```bash
# Validate
pnpm pet:validate pets/my-pet

# Pack
pnpm pet:pack pets/my-pet --out my-pet.spa

# Publish (when marketplace live)
pnpm pet:publish my-pet.spa --price 2.99 --license single
```

---

## B. Agent-Built: Let Smart Build It For You

No asset skills needed — just prompt Smart itself (once the agent is running):

**Via chat** (GUI bubble):

```
You: Build me a pet. A small fox that wags tail when I say good job, sleeps when I'm idle 3min, and flies across screen when I ask it to do a task.

Smart: [thinks → delegates to opencode + kilocode → generates assets]
```

**Via CLI**:

```bash
smart-pet "scaffold pet fox --traits wagOnPraise,sleepOnIdle,flyOnTask --engine spine --out pets/fox"
```

**What the agent does** (tools it will use):

1. **Designs** rig or selects video template via `packages/core/animation-controller.ts` states
2. **Generates** assets: uses `ffmpeg` for webm stubs, or scaffolds `rig.json` + placeholder PNGs
3. **Writes** `manifest.json` + `pet.config.json` per spec above
4. **Validates** via `pet:validate` hook
5. **Hot-loads** into running overlay for preview

**Tool wiring already in repo**:

- `packages/core/src/animation-controller.ts` — registry for `walk|fly|smile|talk|sleep|dance|wink|think|wave|sad|angry|point|alert|celebrate`
- `apps/desktop/index.html` — hitbox + drag + rapidClick already matching PetClaw's 0.62/B logic
- `packages/core/src/peripheral-manager.ts` — sleep patrol intervals
- `packages/core/src/delegation-manager.ts` — agent can call `opencode`/`kilocode` to scaffold pet code as sub-agents

**Stub generator** (if no artist yet):

```bash
mkdir -p pets/stub-pet/assets
# generate 1 transparent webm stub from a PNG (agent will do this)
ffmpeg -loop 1 -i icon.png -c:v libvpx-vp9 -pix_fmt yuva420p -t 2 assets/static.webm
cp assets/static.webm assets/{begin,listening,task-start,task-loop,task-leave,sleep-start,sleep-loop,sleep-leave}.webm
```

---

## C. Overlay Behavior (kept from PetClaw template)

- **Transparent, alwaysOnTop, frameless, skipTaskbar, click-through via `setIgnoreMouseEvents(!hover)`** — pet sits above game/video but clicks pass through when not hovering pet (62% center hitbox).
- **Drag anywhere on pet** → window follows cursor (RAF), pauses patrol.
- **Rapid triple-click** → toggle chat bubble.
- **Patrol/sleep**: disabled by default in Smart (thought-driven instead), but config allows timer-based if you want PetClaw parity.

---

*Spec version 0.1.0 — matches PetClaw 0.1.3 extraction. File your pet at `pets/` and PR.*
