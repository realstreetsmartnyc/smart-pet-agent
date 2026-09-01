// Smart Pet Agent — Pet Pack Validator
export interface PetManifest { id: string; name: string; version: string; engine: string; preview?: string; tags?: string[]; defaultState?: string; }
export interface PetConfig { states: Record<string, { src?: string; loop?: boolean; next?: string; intent?: string; halo?: string }>; hitbox?: number; intents?: string[] }

const REQUIRED_INTENTS = ["idle","listening","thinking","planning","acting","waiting","asking_permission","celebrating","warning","sleeping","resuming"];
const VALID_ENGINES = ["video","canvas","lottie","spine","three"];

export function validatePetPack(manifest: PetManifest, config: PetConfig | null, opts?: { baseDir?: string; checkAssets?: boolean }): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!manifest.id || !/^[a-z0-9-]+$/.test(manifest.id)) errors.push("manifest.id must be kebab-case");
  if (!manifest.name) errors.push("manifest.name required");
  if (!manifest.version) errors.push("manifest.version required");
  if (!VALID_ENGINES.includes(manifest.engine)) errors.push(`engine must be one of ${VALID_ENGINES.join(", ")}`);
  if (config) {
    if (config.hitbox !== undefined && (config.hitbox < 0 || config.hitbox > 1)) errors.push("hitbox must be 0..1");
    const intents = config.intents || Object.values(config.states).map(s=>s.intent).filter(Boolean) as string[];
    for (const req of REQUIRED_INTENTS) if (!intents.includes(req)) warnings.push(`missing intent: ${req} (fallback will use idle)`);
    for (const [k, s] of Object.entries(config.states)) {
      if (s.next && !config.states[s.next]) warnings.push(`state ${k} next->${s.next} missing`);
    }
    if (manifest.engine === 'video' && opts?.checkAssets && opts?.baseDir) {
      for (const [k, s] of Object.entries(config.states)) {
        if (s.src) {
          try {
            const { existsSync } = require('fs');
            const { join } = require('path');
            if (!existsSync(join(opts.baseDir, s.src))) warnings.push(`missing asset for state ${k}: ${s.src}`);
          } catch {}
        }
      }
      if (manifest.preview) {
        try {
          const { existsSync } = require('fs');
          const { join } = require('path');
          if (!existsSync(join(opts.baseDir, manifest.preview))) warnings.push(`missing preview: ${manifest.preview}`);
        } catch {}
      }
    }
  } else {
    warnings.push("no pet.config.json — using defaults (B=0.62, idle only)");
  }
  return { ok: errors.length===0, errors, warnings };
}
