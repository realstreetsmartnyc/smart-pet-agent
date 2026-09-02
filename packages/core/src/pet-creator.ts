// Custom Pet Creator — public API for the MVP flow
// Exposes: safeIngestImage, activatePetPack, deactivatePetPack (rollback),
// listInstalledPets, exportPetPack, importPetPack.
//
// This module is the activation/lifecycle layer on top of pet-generator.ts
// (which produces a staged PetSource + assets in the workspace) and
// pet-workspace.ts (which owns the staged/ + installed/ root paths).
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  WORKSPACE_ROOT,
  PETS_ROOT,
  ensureWorkspace,
  workspacePath,
  assertNoTraversal,
  MAX_IMAGE_BYTES,
  ALLOWED_MIME,
} from './pet-workspace.js';
import { validatePetPack, PetManifest, PetConfig } from './pet-validator.js';
import { PetSource } from './pet-source.js';

export interface IngestResult {
  ok: boolean;
  jobId: string;
  storedPath?: string;
  bytes?: number;
  mime?: string;
  errors: string[];
}

export function detectMimeByMagic(head: Buffer): string | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return 'image/png';
  // JPEG: FF D8 FF
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg';
  // WebP: RIFF....WEBP
  if (head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export function safeIngestImage(srcPath: string, jobId?: string): IngestResult {
  const errors: string[] = [];
  const id = jobId || `ingest-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  // path-traversal guard on the source
  try { assertNoTraversal(srcPath); } catch (e: any) { errors.push(`unsafe source path: ${e.message}`); return { ok: false, jobId: id, errors }; }
  if (!fs.existsSync(srcPath)) { errors.push('source not found'); return { ok: false, jobId: id, errors }; }
  const stat = fs.statSync(srcPath);
  if (!stat.isFile()) { errors.push('source is not a regular file'); return { ok: false, jobId: id, errors }; }
  if (stat.size > MAX_IMAGE_BYTES) { errors.push(`source exceeds MAX_IMAGE_BYTES (${stat.size} > ${MAX_IMAGE_BYTES})`); return { ok: false, jobId: id, errors }; }
  // Read header for MIME detection
  const fd = fs.openSync(srcPath, 'r');
  const head = Buffer.alloc(Math.min(16, stat.size));
  try { fs.readSync(fd, head, 0, head.length, 0); } finally { fs.closeSync(fd); }
  const mime = detectMimeByMagic(head);
  if (!mime) { errors.push(`unrecognized image format (magic bytes did not match PNG/JPEG/WebP)`); return { ok: false, jobId: id, errors }; }
  if (!ALLOWED_MIME.has(mime)) { errors.push(`mime not allowed: ${mime}`); return { ok: false, jobId: id, errors }; }
  // Stage into workspace
  ensureWorkspace(id);
  const ext = mime === 'image/png' ? '.png' : mime === 'image/jpeg' ? '.jpg' : '.webp';
  const dest = workspacePath(id, 'input', `source${ext}`);
  fs.copyFileSync(srcPath, dest);
  const stored = fs.statSync(dest);
  return { ok: true, jobId: id, storedPath: dest, bytes: stored.size, mime, errors };
}

export interface ActivateResult {
  ok: boolean;
  id: string;
  version: string;
  previousVersion: string | null;
  installedAt: number;
  errors: string[];
}

export function activatePetPack(jobId: string, options?: { allowReinstall?: boolean }): ActivateResult {
  const errors: string[] = [];
  const srcDir = workspacePath(jobId, 'generated');
  const manifestPath = path.join(srcDir, 'manifest.json');
  const configPath = path.join(srcDir, 'pet.config.json');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(configPath)) {
    errors.push('generated/manifest.json or pet.config.json missing — did you run the generator?');
    return { ok: false, id: '', version: '', previousVersion: null, installedAt: 0, errors };
  }
  const manifest: PetManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const config: PetConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const v = validatePetPack(manifest, config);
  if (!v.ok) { errors.push(...v.errors); return { ok: false, id: manifest.id || '', version: manifest.version || '', previousVersion: null, installedAt: 0, errors }; }

  const id = manifest.id;
  const version = manifest.version;
  const idRoot = path.join(PETS_ROOT, id);
  fs.mkdirSync(idRoot, { recursive: true });

  // Backup current active version (for rollback) before overwriting
  const activePath = path.join(idRoot, 'active.json');
  let previousVersion: string | null = null;
  if (fs.existsSync(activePath)) {
    try { previousVersion = JSON.parse(fs.readFileSync(activePath, 'utf8')).active || null; } catch {}
  }

  // Atomic install: write to .tmp, then rename
  const tmpDest = path.join(idRoot, `${version}.tmp`);
  const finalDest = path.join(idRoot, version);
  if (fs.existsSync(finalDest) && !options?.allowReinstall) {
    errors.push(`version ${version} already installed for ${id}; pass { allowReinstall: true } to overwrite`);
    return { ok: false, id, version, previousVersion, installedAt: 0, errors };
  }
  fs.rmSync(tmpDest, { recursive: true, force: true });
  fs.mkdirSync(tmpDest, { recursive: true });
  for (const f of fs.readdirSync(srcDir)) {
    fs.copyFileSync(path.join(srcDir, f), path.join(tmpDest, f));
  }
  // Copy preview asset if present
  const previewSrc = workspacePath(jobId, 'preview', 'preview.svg');
  if (fs.existsSync(previewSrc)) {
    fs.mkdirSync(path.join(tmpDest, 'assets'), { recursive: true });
    fs.copyFileSync(previewSrc, path.join(tmpDest, 'assets', 'preview.svg'));
  }
  // Copy ingested source image if present (for re-edit/inspect)
  const inputDir = workspacePath(jobId, 'input');
  if (fs.existsSync(inputDir)) {
    for (const f of fs.readdirSync(inputDir)) {
      fs.mkdirSync(path.join(tmpDest, 'input'), { recursive: true });
      fs.copyFileSync(path.join(inputDir, f), path.join(tmpDest, 'input', f));
    }
  }
  fs.rmSync(finalDest, { recursive: true, force: true });
  fs.renameSync(tmpDest, finalDest);

  // Update active.json
  fs.writeFileSync(activePath, JSON.stringify({ active: version, previous: previousVersion, installedAt: Date.now() }, null, 2));
  return { ok: true, id, version, previousVersion, installedAt: Date.now(), errors };
}

export interface InstalledPet {
  id: string;
  active: string;
  previous: string | null;
  installedAt: number;
  versions: string[];
}

export function listInstalledPets(): InstalledPet[] {
  if (!fs.existsSync(PETS_ROOT)) return [];
  const out: InstalledPet[] = [];
  for (const id of fs.readdirSync(PETS_ROOT)) {
    const idRoot = path.join(PETS_ROOT, id);
    if (!fs.statSync(idRoot).isDirectory()) continue;
    const versions = fs.readdirSync(idRoot).filter(v => v !== 'active.json' && !v.endsWith('.tmp'));
    const activePath = path.join(idRoot, 'active.json');
    let active = versions[0] || 'default';
    let previous: string | null = null;
    let installedAt = 0;
    if (fs.existsSync(activePath)) {
      try {
        const a = JSON.parse(fs.readFileSync(activePath, 'utf8'));
        if (a.active) active = a.active;
        if (a.previous) previous = a.previous;
        if (a.installedAt) installedAt = a.installedAt;
      } catch {}
    }
    out.push({ id, active, previous, installedAt, versions });
  }
  return out;
}

export function getInstalledPet(id: string): InstalledPet | null {
  return listInstalledPets().find(p => p.id === id) || null;
}

export interface RollbackResult {
  ok: boolean;
  id: string;
  restoredTo: string | null;
  removedVersion: string | null;
  errors: string[];
}

export function deactivatePetPack(id: string): RollbackResult {
  const errors: string[] = [];
  const idRoot = path.join(PETS_ROOT, id);
  if (!fs.existsSync(idRoot)) { errors.push(`pet not installed: ${id}`); return { ok: false, id, restoredTo: null, removedVersion: null, errors }; }
  const activePath = path.join(idRoot, 'active.json');
  let active: string | null = null;
  let previous: string | null = null;
  if (fs.existsSync(activePath)) {
    try { const a = JSON.parse(fs.readFileSync(activePath, 'utf8')); active = a.active; previous = a.previous; } catch {}
  }
  if (!active) { errors.push('no active version recorded'); return { ok: false, id, restoredTo: null, removedVersion: null, errors }; }
  const activeDir = path.join(idRoot, active);
  if (fs.existsSync(activeDir)) fs.rmSync(activeDir, { recursive: true, force: true });
  // Restore previous version
  if (previous && fs.existsSync(path.join(idRoot, previous))) {
    fs.writeFileSync(activePath, JSON.stringify({ active: previous, previous: null, restoredAt: Date.now() }, null, 2));
    return { ok: true, id, restoredTo: previous, removedVersion: active, errors };
  }
  // No previous: just remove active.json and any remaining versions
  if (fs.existsSync(activePath)) fs.unlinkSync(activePath);
  // If nothing left, remove the id dir
  const remaining = fs.readdirSync(idRoot).filter(v => v !== 'active.json' && !v.endsWith('.tmp'));
  if (remaining.length === 0) fs.rmSync(idRoot, { recursive: true, force: true });
  return { ok: true, id, restoredTo: null, removedVersion: active, errors };
}

// ===== Export / Import (.smartpet) =====
// Format: a JSON envelope with base64-encoded manifest, config, and assets.
// We use JSON (not tar) for portability and to avoid native tar deps.
// File extension: .smartpet

export interface SmartPetEnvelope {
  format: 'smartpet';
  version: 1;
  exportedAt: number;
  sourcePetId?: string;
  sourceVersion?: string;
  manifest: PetManifest;
  config: PetConfig;
  assets: Record<string, string>; // path -> base64-encoded bytes
}

export function exportPetPack(jobId: string, options?: { sourcePetId?: string; sourceVersion?: string }): string {
  const srcDir = workspacePath(jobId, 'generated');
  const manifestPath = path.join(srcDir, 'manifest.json');
  const configPath = path.join(srcDir, 'pet.config.json');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(configPath)) {
    throw new Error('generated/manifest.json or pet.config.json missing');
  }
  const manifest: PetManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const config: PetConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const assets: Record<string, string> = {};
  // preview
  const preview = workspacePath(jobId, 'preview', 'preview.svg');
  if (fs.existsSync(preview)) assets['preview.svg'] = fs.readFileSync(preview).toString('base64');
  // ingested input (if any)
  const inputDir = workspacePath(jobId, 'input');
  if (fs.existsSync(inputDir)) {
    for (const f of fs.readdirSync(inputDir)) {
      assets[`input/${f}`] = fs.readFileSync(path.join(inputDir, f)).toString('base64');
    }
  }
  const env: SmartPetEnvelope = {
    format: 'smartpet',
    version: 1,
    exportedAt: Date.now(),
    sourcePetId: options?.sourcePetId,
    sourceVersion: options?.sourceVersion,
    manifest, config, assets,
  };
  return JSON.stringify(env, null, 2);
}

export function writeExportToFile(jobId: string, destPath: string, options?: { sourcePetId?: string; sourceVersion?: string }): string {
  const json = exportPetPack(jobId, options);
  fs.writeFileSync(destPath, json);
  return destPath;
}

export interface ImportResult {
  ok: boolean;
  jobId: string;
  manifest: PetManifest;
  config: PetConfig;
  errors: string[];
}

export function importPetPack(srcPath: string, jobId?: string): ImportResult {
  const errors: string[] = [];
  if (!fs.existsSync(srcPath)) { errors.push('source not found'); return { ok: false, jobId: '', manifest: {} as any, config: {} as any, errors }; }
  let env: SmartPetEnvelope;
  try { env = JSON.parse(fs.readFileSync(srcPath, 'utf8')); } catch (e: any) { errors.push(`invalid .smartpet (not JSON): ${e.message}`); return { ok: false, jobId: '', manifest: {} as any, config: {} as any, errors }; }
  if (env.format !== 'smartpet') { errors.push(`unrecognized format: ${env.format}`); return { ok: false, jobId: '', manifest: env.manifest || ({} as any), config: env.config || ({} as any), errors }; }
  if (env.version !== 1) { errors.push(`unsupported version: ${env.version}`); return { ok: false, jobId: '', manifest: env.manifest, config: env.config, errors }; }
  const v = validatePetPack(env.manifest, env.config);
  if (!v.ok) { errors.push(...v.errors); return { ok: false, jobId: '', manifest: env.manifest, config: env.config, errors }; }
  // Stage into a fresh workspace
  const id = jobId || `import-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  ensureWorkspace(id);
  const genDir = path.join(workspacePath(id), 'generated');
  const prevDir = path.join(workspacePath(id), 'preview');
  fs.mkdirSync(genDir, { recursive: true });
  fs.mkdirSync(prevDir, { recursive: true });
  fs.writeFileSync(path.join(genDir, 'manifest.json'), JSON.stringify(env.manifest, null, 2));
  fs.writeFileSync(path.join(genDir, 'pet.config.json'), JSON.stringify(env.config, null, 2));
  for (const [rel, b64] of Object.entries(env.assets || {})) {
    const bytes = Buffer.from(b64, 'base64');
    if (rel === 'preview.svg') {
      fs.writeFileSync(path.join(prevDir, 'preview.svg'), bytes);
    } else if (rel.startsWith('input/')) {
      const inDir = path.join(workspacePath(id), 'input');
      fs.mkdirSync(inDir, { recursive: true });
      fs.writeFileSync(path.join(inDir, rel.slice('input/'.length)), bytes);
    }
  }
  return { ok: true, jobId: id, manifest: env.manifest, config: env.config, errors };
}
