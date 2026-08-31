# Smart Pet Agent UI Brand Brief

Date: 2026-08-30
Purpose: Define the visual and interaction direction for Smart Pet Agent as a Street Smart NYC-branded ambient OS companion app.

## Product Naming

Use `Smart Pet Agent` as the product name in:

- app title
- tray text
- onboarding
- settings
- docs
- installer copy
- splash/loading copy

Use `Smart` only as the pet's conversational short name, not as the full product label.

## Brand Personality

Smart Pet Agent should feel:

- street-smart
- observant
- fast
- protective
- capable
- warm without being sugary
- stylish without being flashy

It should not feel:

- like a toy
- like a generic AI SaaS dashboard
- like a pastel kawaii mascot app
- like a clone of PetClaw or OpenClaw

## NYC Visual Direction

The aesthetic should pull from:

- subway platform lighting
- glass reflections on wet sidewalks
- transit map geometry
- taxi yellow accents
- steel and concrete neutrals
- corner-store glow at night
- clean civic signage

This means the UI should combine:

- dark grounded surfaces
- warm signal accents
- crisp status indicators
- restrained glow
- simple geometry with a little grit

## Color System

Recommended base palette:

- `ink-950`: `#0b0d10`
- `asphalt-900`: `#14181d`
- `steel-700`: `#41505f`
- `tile-100`: `#f2efe8`
- `taxi-500`: `#f4b400`
- `signal-500`: `#ff8a1f`
- `civic-500`: `#2f80ed`
- `alert-500`: `#d64545`
- `success-500`: `#2da56a`

Usage rules:

- `taxi-500` and `signal-500` should carry brand energy
- `civic-500` should be used for active system states and actionable controls
- `alert-500` should be reserved for danger, permission risk, and failed actions
- backgrounds should lean charcoal, smoke, steel, and tile instead of flat black or default white

## Typography Direction

Use a strong sans plus a compact mono.

Recommended tone:

- UI sans: transit-like grotesk or editorial sans
- mono: compact, readable telemetry font for tools, logs, and permissions

Typography behavior:

- headers should feel concise and directive
- labels should read like control surfaces, not marketing copy
- runtime state should be easy to scan from a distance

## Surface Design

### Overlay pet

Goals:

- feel alive in the corner of the screen
- remain readable over games, video, and work apps
- support click-through when not actively hovered
- surface emotion and action state in one glance

Visual notes:

- subtle shadow and glow
- no giant speech balloons
- readable silhouette
- status pulse or halo when listening/thinking/acting

### Thought bubble

Goals:

- act as a compact operations ticker
- show progress, intent, and key tool states
- stay visually attached to the pet

Visual notes:

- smoked-glass card
- route-line accent or signal stripe
- chips for `Listening`, `Thinking`, `Using Browser`, `Needs Permission`, `Done`
- quick fade and slide transitions

### Chat window

Goals:

- feel like a command center plus companion console
- support task history, permissions, tools, device state, and pet settings
- preserve warmth without losing operational clarity

Layout direction:

- left rail for sections
- main conversation column
- right utility drawer later for tools, permissions, and active task details

Sections:

- Home
- Chat
- Tasks
- Devices
- Permissions
- Pets
- Skills
- Memory
- Settings

### Settings

Goals:

- make powerful capabilities feel safe and understandable
- separate access categories clearly

Priority panels:

- model providers
- devices and peripherals
- computer use
- privacy and memory
- pet appearance and voice
- delegation targets

## Motion Direction

Motion should feel intentional and city-like:

- short slide-ins
- route-trace lines
- pulse on thought
- snap-to-state on approvals and failures
- soft idle breathing when calm

Avoid:

- floaty generic AI animations
- excessive springiness
- noisy particle effects
- random movement with no semantic reason

## Pet Expression System

The pet should visibly differentiate:

- idle
- listening
- thinking
- planning
- acting
- waiting
- asking permission
- celebrating
- warning
- sleeping
- resuming

Expressions can be shown through:

- gaze direction
- blink speed
- mouth motion
- ear or wing pose
- tail posture
- halo or accent color
- travel path or body lean

## Content Tone

UI copy should sound:

- direct
- human
- competent
- lightly companionable

Examples of preferred tone:

- `Ready on your desktop`
- `Need your permission to use the camera`
- `Watching this task for you`
- `Still working`
- `I can take that over`

Avoid:

- over-cute filler
- baby talk
- overly corporate assistant language

## Screen Goals

### Goal 1: Ambient overlay

- Pet visible and performant
- Bubble readable at a glance
- Hover and drag feel precise
- Status readable over mixed backgrounds

### Goal 2: Fast chat

- Send input instantly
- Stream response clearly
- Show action provenance and current task state
- Keep the brand consistent with the overlay

### Goal 3: Trust dashboard

- Devices and permissions readable in one place
- Current access and recent actions auditable
- Delegated work clearly labeled

### Goal 4: Pet customization

- Pick pets, voices, and moods
- Preview packs before enabling them
- Understand how a pet maps states and expressions

### Goal 5: Ongoing work

- Background tasks visible
- Scheduled or proactive behavior easy to inspect
- Notification tone aligned with the ambient companion experience

## Full Product Goals

- Build a recognizable Smart Pet Agent identity
- Match Street Smart NYC branding across all surfaces
- Deliver a polished standalone desktop app
- Preserve local-first trust and ownership
- Support strong agent capabilities without losing warmth
- Make permissions and device actions understandable
- Let the pet embody reasoning instead of randomness
- Keep CLI, TUI, and GUI aligned under one runtime
- Support custom pets and future creator tooling
- Leave room for later mobile and companion surfaces

## Immediate UI Implementation Goals

- Replace generic default blue-and-white dashboard styling
- Replace system-font-only styling with a branded type system
- Add a real color token set and shared design variables
- Rename visible `Smart-Pet` labels to `Smart Pet Agent`
- Rework the chat shell into a Street Smart NYC command-center layout
- Rework the pet fallback visuals so they feel like a branded companion, not a placeholder orb
- Add permission, device, and task status affordances to the dashboard design
