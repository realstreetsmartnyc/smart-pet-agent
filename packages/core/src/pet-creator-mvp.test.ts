// Custom Pet Creator MVP — full-flow test
// Exercises: safeIngestImage → generateSource → generateAssets → activatePetPack
//   → listInstalledPets → exportPetPack → importPetPack → activatePetPack (re-import)
//   → deactivatePetPack (rollback)
process.env.SMART_PET_TEST = '1';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
  safeIngestImage,
  activatePetPack,
  deactivatePetPack,
  listInstalledPets,
  getInstalledPet,
  exportPetPack,
  writeExportToFile,
  importPetPack,
  detectMimeByMagic,
} from './pet-creator.js';
import { localPlaceholderProvider, getPetProvider } from './pet-generator.js';
import { validatePetPack } from './pet-validator.js';
import { WORKSPACE_ROOT, PETS_ROOT } from './pet-workspace.js';

function tmpPng(): string {
  // Minimal valid PNG: 1x1 transparent
  const png = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6300010000000500010d0a2db40000000049454e44ae426082',
    'hex'
  );
  const p = path.join(os.tmpdir(), `mvp-${crypto.randomBytes(4).toString('hex')}.png`);
  fs.writeFileSync(p, png);
  return p;
}

function freshJobId(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

describe('Custom Pet Creator MVP — full flow', () => {
  it('detects PNG by magic bytes', () => {
    const png = Buffer.from('89504e470d0a1a0a', 'hex');
    assert.equal(detectMimeByMagic(png), 'image/png');
  });
  it('detects JPEG by magic bytes', () => {
    const jpg = Buffer.from('ffd8ffe000104a464946', 'hex');
    assert.equal(detectMimeByMagic(jpg), 'image/jpeg');
  });
  it('detects WebP by magic bytes', () => {
    const wp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
    assert.equal(detectMimeByMagic(wp), 'image/webp');
  });
  it('rejects unknown image format', () => {
    const garbage = Buffer.from('not an image at all');
    assert.equal(detectMimeByMagic(garbage), null);
  });

  it('safeIngestImage copies a valid PNG into the workspace and records MIME', () => {
    const src = tmpPng();
    const r = safeIngestImage(src);
    assert.equal(r.ok, true, `errors: ${r.errors.join('; ')}`);
    assert.equal(r.mime, 'image/png');
    assert.ok(r.bytes && r.bytes > 0);
    assert.ok(r.storedPath && fs.existsSync(r.storedPath));
    assert.ok(r.storedPath!.startsWith(WORKSPACE_ROOT));
    fs.unlinkSync(src);
  });

  it('safeIngestImage rejects path traversal', () => {
    const r = safeIngestImage('/tmp/../etc/passwd');
    assert.equal(r.ok, false);
    assert.ok(r.errors.some(e => /unsafe|traversal/i.test(e)));
  });

  it('safeIngestImage rejects missing source', () => {
    const r = safeIngestImage('/tmp/does-not-exist-' + crypto.randomBytes(4).toString('hex'));
    assert.equal(r.ok, false);
  });

  it('full MVP flow: ingest → generate → validate → activate → list → export → import → activate → rollback', async () => {
    // 1) Ingest a valid image
    const src = tmpPng();
    const ingest = safeIngestImage(src, freshJobId('flow'));
    assert.equal(ingest.ok, true, `ingest errors: ${ingest.errors.join('; ')}`);
    const jobId = ingest.jobId;
    fs.unlinkSync(src);

    // 2) Generate source + assets via the local-placeholder provider
    const prov = getPetProvider('local-placeholder');
    const rightsAcknowledged = true;
    const source = await prov.generateSource(
      { imagePath: ingest.storedPath, description: 'nyc blue orb', rightsAcknowledged },
      jobId
    );
    assert.equal(source.input.rightsAcknowledged, true);
    assert.equal(source.behavior.states.length, 11);
    assert.equal(source.validation.errors.length, 0);

    const assets = await prov.generateAssets(source, jobId);
    assert.ok(fs.existsSync(assets.preview));

    // 3) Validation
    const v = validatePetPack(assets.manifest, assets.config);
    assert.equal(v.ok, true, `validate errors: ${v.errors.join('; ')}`);

    // 4) Activation
    const act = activatePetPack(jobId);
    assert.equal(act.ok, true, `activate errors: ${act.errors.join('; ')}`);
    assert.ok(act.id);
    assert.ok(act.version);

    // 5) listInstalledPets should now include our pet
    const list = listInstalledPets();
    const found = list.find(p => p.id === act.id);
    assert.ok(found, `installed pet ${act.id} not in list: ${list.map(p => p.id).join(', ')}`);
    assert.equal(found!.active, act.version);

    // 6) Export
    const exportPath = path.join(os.tmpdir(), `mvp-export-${crypto.randomBytes(3).toString('hex')}.smartpet`);
    writeExportToFile(jobId, exportPath, { sourcePetId: act.id, sourceVersion: act.version });
    assert.ok(fs.existsSync(exportPath));
    const env = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    assert.equal(env.format, 'smartpet');
    assert.equal(env.version, 1);
    assert.equal(env.sourcePetId, act.id);
    assert.equal(env.sourceVersion, act.version);
    assert.ok(env.assets['preview.svg']);

    // 7) Import (into a new jobId)
    const importResult = importPetPack(exportPath);
    assert.equal(importResult.ok, true, `import errors: ${importResult.errors.join('; ')}`);
    assert.equal(importResult.manifest.id, act.id);
    assert.equal(importResult.manifest.version, act.version);

    // 8) Activate the imported pack (should succeed — atomic install)
    const act2 = activatePetPack(importResult.jobId, { allowReinstall: true });
    assert.equal(act2.ok, true, `re-activate errors: ${act2.errors.join('; ')}`);
    assert.equal(act2.id, act.id);
    assert.equal(act2.version, act.version);

    // 9) Rollback (deactivate)
    const rb = deactivatePetPack(act.id);
    assert.equal(rb.ok, true, `rollback errors: ${rb.errors.join('; ')}`);
    assert.equal(rb.removedVersion, act.version);

    // 10) After rollback, the pet should be gone (no previous version)
    const after = getInstalledPet(act.id);
    assert.equal(after, null, `pet still listed after rollback: ${JSON.stringify(after)}`);

    // cleanup
    fs.unlinkSync(exportPath);
  });

  it('rollback restores the previous version when one exists', () => {
    // Install v0.1.0, then v0.2.0, then rollback v0.2.0 — should restore v0.1.0
    const job1 = freshJobId('rollback');
    const src = tmpPng();
    const ingest = safeIngestImage(src, job1);
    fs.unlinkSync(src);
    assert.equal(ingest.ok, true);
    (async () => {})(); // noop — we use the synchronous flow below

    // Manually craft a minimal generated/ for v0.1.0 and v0.2.0 since the local-placeholder
    // generator always uses the same manifest; we just write two distinct version dirs.
    const id = `rollback-test-${crypto.randomBytes(3).toString('hex')}`;
    const idRoot = path.join(PETS_ROOT, id);
    fs.mkdirSync(path.join(idRoot, '0.1.0'), { recursive: true });
    fs.mkdirSync(path.join(idRoot, '0.2.0'), { recursive: true });
    const manifest = (v: string) => ({ id, name: `RB ${v}`, version: v, engine: 'canvas', preview: 'preview.svg', tags: ['test'], defaultState: 'idle' });
    const config = { states: { idle: { intent: 'idle', loop: true } }, hitbox: 0.5 };
    fs.writeFileSync(path.join(idRoot, '0.1.0', 'manifest.json'), JSON.stringify(manifest('0.1.0'), null, 2));
    fs.writeFileSync(path.join(idRoot, '0.1.0', 'pet.config.json'), JSON.stringify(config, null, 2));
    fs.writeFileSync(path.join(idRoot, '0.2.0', 'manifest.json'), JSON.stringify(manifest('0.2.0'), null, 2));
    fs.writeFileSync(path.join(idRoot, '0.2.0', 'pet.config.json'), JSON.stringify(config, null, 2));
    fs.writeFileSync(path.join(idRoot, 'active.json'), JSON.stringify({ active: '0.2.0', previous: '0.1.0', installedAt: Date.now() }, null, 2));

    // Rollback
    const rb = deactivatePetPack(id);
    assert.equal(rb.ok, true, `rollback errors: ${rb.errors.join('; ')}`);
    assert.equal(rb.removedVersion, '0.2.0');
    assert.equal(rb.restoredTo, '0.1.0');

    // After rollback: 0.1.0 still present, 0.2.0 gone, active.json says 0.1.0
    assert.ok(fs.existsSync(path.join(idRoot, '0.1.0')));
    assert.ok(!fs.existsSync(path.join(idRoot, '0.2.0')));
    const a = JSON.parse(fs.readFileSync(path.join(idRoot, 'active.json'), 'utf8'));
    assert.equal(a.active, '0.1.0');
    assert.equal(a.previous, null);

    // cleanup
    fs.rmSync(idRoot, { recursive: true, force: true });
  });
});
