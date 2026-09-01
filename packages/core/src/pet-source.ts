// Canonical Pet Source Model (Sprint 5+ Custom Pet Creator, provider-gated, isolated from installed pets)
export type PetSourceType = 'image' | 'description' | 'image_and_description';
export type PetTarget = 'electron-canvas' | 'electron-video' | 'web-preview' | 'mobile-preview' | 'lottie' | 'rive' | 'spine' | 'three';

export interface PetSource {
  identity: { id: string; name: string; description: string; version: string };
  input: { sourceType: PetSourceType; sourceReference: string; rightsAcknowledged: boolean };
  personality: { traits: string[]; tone: string; bio: string };
  visualStyle: { palette: string[]; species: string; style: string };
  behavior: {
    states: Array<{ name: string; intent: string; halo?: string; animation?: string }>;
    transitions: Array<{ from: string; to: string }>;
    interactionRules: { draggable: boolean; clickThrough: boolean; voiceResponse: boolean; idleBehavior: string; movement: string };
  };
  targetFormats: PetTarget[];
  generatedAssets: { source: string[]; preview: string[]; desktop: string[]; mobile: string[]; icons: string[] };
  validation: { errors: string[]; warnings: string[] };
  provenance: { providerId: string; requestId: string; createdAt: number; sourceImageHash?: string };
}

export const DEFAULT_STATES = [
  { name: 'idle', intent: 'idle' },
  { name: 'listening', intent: 'listening', halo: 'civic-500' },
  { name: 'thinking', intent: 'thinking', halo: 'taxi-500' },
  { name: 'planning', intent: 'planning', halo: 'taxi-500' },
  { name: 'acting', intent: 'acting', halo: 'signal-500' },
  { name: 'waiting', intent: 'waiting' },
  { name: 'asking', intent: 'asking_permission', halo: 'signal-500' },
  { name: 'celebrating', intent: 'celebrating', halo: 'success-500' },
  { name: 'warning', intent: 'warning', halo: 'alert-500' },
  { name: 'sleeping', intent: 'sleeping' },
  { name: 'resuming', intent: 'resuming', halo: 'civic-500' },
];

export function normalizeSourceType(hasImage: boolean, hasDescription: boolean): PetSourceType {
  if (hasImage && hasDescription) return 'image_and_description';
  if (hasImage) return 'image';
  return 'description';
}

export function validatePetSource(source: PetSource): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!source.identity?.id || !/^[a-z0-9-]+$/.test(source.identity.id)) errors.push('identity.id must be kebab-case');
  if (!source.identity?.name) errors.push('identity.name required');
  if (!source.input?.rightsAcknowledged) errors.push('rightsAcknowledged required before export');
  if (source.input?.sourceReference?.includes('..') || source.input?.sourceReference?.includes('/.')) errors.push('sourceReference path traversal');
  return { ok: errors.length === 0, errors, warnings };
}
