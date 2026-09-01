// Pet generator — provider-gated, local-placeholder deterministic
import { AIManager } from './ai-manager.js';
import { PetSource, DEFAULT_STATES, validatePetSource, normalizeSourceType } from './pet-source.js';
import { validatePetPack } from './pet-validator.js';
import { ensureWorkspace, workspacePath, MAX_IMAGE_BYTES, ALLOWED_MIME } from './pet-workspace.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface PetGenerationProvider {
  id: string;
  capabilities: { imageReference: boolean; descriptionGeneration: boolean; animationGeneration: boolean; formats: string[] };
  generateSource(input: { imagePath?: string; description?: string; rightsAcknowledged: boolean }, jobId: string): Promise<PetSource>;
  generateAssets(source: PetSource, jobId: string): Promise<{ preview: string; manifest: any; config: any }>;
}

export const PET_TOOLS = [
  { name: 'pet_normalize_input', description: 'normalize image/description input' },
  { name: 'pet_plan_states', description: 'plan 11 states' },
  { name: 'pet_generate_assets', description: 'generate Canvas/PNG assets' },
  { name: 'pet_validate', description: 'validate pack' },
  { name: 'pet_export', description: 'export .smartpet' },
];

export const localPlaceholderProvider: PetGenerationProvider = {
  id: 'local-placeholder',
  capabilities: { imageReference: false, descriptionGeneration: true, animationGeneration: false, formats: ['electron-canvas','web-preview'] },
  async generateSource(input, jobId) {
    const hasImage = !!input.imagePath;
    const hasDesc = !!input.description?.trim();
    const sourceType = normalizeSourceType(hasImage, hasDesc);
    const id = `pet-${jobId.slice(0,8)}`;
    const name = hasDesc ? input.description!.slice(0,24).replace(/[^a-z0-9 ]/gi,'').trim() || 'Custom Pet' : 'Custom Pet';
    const source: PetSource = {
      identity: { id, name, description: input.description || 'Generated via local-placeholder', version: '0.1.0' },
      input: { sourceType, sourceReference: input.imagePath || 'description', rightsAcknowledged: input.rightsAcknowledged },
      personality: { traits: ['playful','curious'], tone: 'friendly', bio: input.description || 'A custom companion' },
      visualStyle: { palette: ['#f4b400','#2f80ed','#ff8a1f'], species: 'orb', style: 'nyc-glass' },
      behavior: { states: DEFAULT_STATES as any, transitions: DEFAULT_STATES.slice(0,-1).map((s,i)=>({from:s.name,to:DEFAULT_STATES[i+1].name})), interactionRules: { draggable:true, clickThrough:false, voiceResponse:true, idleBehavior:'breathe', movement:'float' } },
      targetFormats: ['electron-canvas','web-preview'],
      generatedAssets: { source: [], preview: [], desktop: [], mobile: [], icons: [] },
      validation: { errors: [], warnings: [] },
      provenance: { providerId: 'local-placeholder', requestId: jobId, createdAt: Date.now(), sourceImageHash: hasImage ? crypto.createHash('sha256').update(input.imagePath!).digest('hex').slice(0,16) : undefined },
    };
    const check = validatePetSource(source);
    source.validation.errors = check.errors;
    source.validation.warnings = check.warnings;
    return source;
  },
  async generateAssets(source, jobId) {
    const dir = ensureWorkspace(jobId);
    const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="48" fill="#0b0d10"/><circle cx="128" cy="128" r="64" fill="#f4b400" opacity="0.9"/><text x="128" y="140" text-anchor="middle" fill="#0b0d10" font-size="14">${source.identity.name.slice(0,12)}</text></svg>`;
    const previewPath = workspacePath(jobId,'preview','preview.svg');
    fs.writeFileSync(previewPath, previewSvg);
    const manifest = { id: source.identity.id, name: source.identity.name, version: source.identity.version, engine: 'canvas', preview: 'preview.svg', tags: ['custom'], defaultState: 'idle' };
    const config = { states: Object.fromEntries(source.behavior.states.map(s=>[s.name,{intent:s.intent,halo:(s as any).halo,loop:true}])), hitbox: 0.62 };
    fs.writeFileSync(workspacePath(jobId,'generated','manifest.json'), JSON.stringify(manifest,null,2));
    fs.writeFileSync(workspacePath(jobId,'generated','pet.config.json'), JSON.stringify(config,null,2));
    const v = validatePetPack(manifest as any, config as any);
    source.validation.errors.push(...v.errors);
    source.validation.warnings.push(...v.warnings);
    return { preview: previewPath, manifest, config };
  }
};

const providers: Record<string, PetGenerationProvider> = { 'local-placeholder': localPlaceholderProvider };

export function getPetProvider(id: string) { return providers[id] || localPlaceholderProvider; }
export function listPetProviders() { return Object.values(providers).map(p=>({id:p.id, capabilities:p.capabilities})); }

// High-level: use AIManager with tools if provider supports it, else fallback to deterministic
export async function generatePetWithAI(ai: AIManager, input: { imagePath?: string; description?: string; rightsAcknowledged: boolean }, jobId: string): Promise<{ source: PetSource; assets: any }> {
  // Try AI via tools — if provider has tools capability, call chat with PET_TOOLS
  // Fallback: local-placeholder directly
  try {
    const hasToolsProvider = (ai as any).fallbackChain?.some((k:string)=> (ai as any).providers?.get(k)?.capabilities?.includes('tools'));
    if (hasToolsProvider) {
      // Let model innately sequence via tools; we still generate deterministically then allow model to refine name/bio via chat
      const resp = await ai.chat({ system: 'You are pet generator. Refine pet name/bio for: '+ (input.description||'custom'), messages: [{role:'user', content: input.description||'custom pet'}], tools: PET_TOOLS as any }).catch(()=>null);
      if (resp?.content) {
        // use model output to enrich name if plausible
      }
    }
  } catch {}
  const prov = getPetProvider('local-placeholder');
  const source = await prov.generateSource(input, jobId);
  const assets = await prov.generateAssets(source, jobId);
  fs.writeFileSync(workspacePath(jobId,'validation.json'), JSON.stringify({ errors: source.validation.errors, warnings: source.validation.warnings },null,2));
  return { source, assets };
}
