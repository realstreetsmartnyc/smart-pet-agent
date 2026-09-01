# Trust — Permission Policy (v1.0.0)

## Model
- All sensitive devices deny-by-default: `screen`, `camera`, `microphone`, `apps`, `files` require explicit `grantPermission`.
- Per-action checks via `PeripheralManager.validateComputerAction()`:
  - `open_app → apps`
  - `click → mouse`
  - `type/key → keyboard`
- `spawn` single-arg, never interpolated shell.

## Destructive Actions
`DESTRUCTIVE_ACTIONS = []` for v1. `open_app` is reversible launch, not destructive. Future `delete_file`/`system_write` will require `confirmed:true` + `scope` check and extra audit. Confirmation is per-action `code: 'CONFIRMATION_REQUIRED'`.

## Audit
Every `computer_use` attempt logs to `memory.logAudit('computer_action', type, allowed|denied|confirmation_required, payload)`. `audit:list` and `tasks:list` are queryable via `RuntimeEvent`.

## Capabilities Probe
`getSystemInfo().capabilities` exposes `{screen,camera,mic}` booleans so UI can show `Permissions: camera: unavailable` instead of `ask` when hardware absent. Windows/Linux adapters now verify `stat.size>0` on capture and throw on failure (no fake path).
