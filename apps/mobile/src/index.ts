// Sprint 4 Mobile Foundation — reuses packages/core same RuntimeEvent + permission model
// Mobile overlay is notification + widget (not transparent BrowserWindow) — chat/bubble are main UI.
import { createRuntimeEvent } from '@smart-pet/core/runtime-events';

export const MOBILE_CAPABILITIES = {
  // Mobile adapters: no mouse/keyboard, add notifications/haptics/biometrics (stub for v1.1)
  screen: false, // mobile screen capture via native, not xdotool
  camera: true,
  mic: true,
  notifications: true,
  haptics: true,
  biometrics: true,
} as const;

export function mobileRuntimeEvent(event: string, payload: any) {
  return createRuntimeEvent(event as any, payload);
}

// Bridge placeholder: in Sprint 4, AgentLoop will use expo-sqlite instead of better-sqlite3
// via op-sqlite adapter injected at initialize(). For now, this file proves the import graph.
export async function mobileSmoke(): Promise<{ ok: boolean; details: string }> {
  const evt = mobileRuntimeEvent('agent.status', { state: 'starting', summary: 'Mobile shell starting' });
  if (evt.version !== 1) return { ok: false, details: 'RuntimeEvent version mismatch' };
  return { ok: true, details: `MOBILE_CAPABILITIES: ${Object.keys(MOBILE_CAPABILITIES).join(',')}` };
}
