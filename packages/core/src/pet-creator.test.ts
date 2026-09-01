process.env.SMART_PET_TEST = '1';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { localPlaceholderProvider, PET_TOOLS } from './pet-generator.js';
import { validatePetPack } from './pet-validator.js';

describe('Custom Pet Creator local-placeholder (Gap 2)', () => {
  it('generates PetSource with 11 states and rightsAcknowledged', async () => {
    const jobId = `test-${Date.now()}`;
    const source = await localPlaceholderProvider.generateSource({ description: 'taxi halo orb', rightsAcknowledged: true }, jobId);
    assert.equal(source.behavior.states.length, 11);
    assert.equal(source.input.rightsAcknowledged, true);
    assert.ok(PET_TOOLS.length >= 5);
  });

  it('generates Canvas assets: preview.svg + manifest + config + Canvas fallback', async () => {
    const jobId = `test-${Date.now()}-assets`;
    const source = await localPlaceholderProvider.generateSource({ description: 'civic blue orb', rightsAcknowledged: true }, jobId);
    const { preview, manifest, config } = await localPlaceholderProvider.generateAssets(source, jobId);
    assert.ok(fs.existsSync(preview), `preview missing ${preview}`);
    assert.equal(manifest.engine, 'canvas');
    assert.ok(manifest.preview === 'preview.svg');
    const v = validatePetPack(manifest, config);
    assert.equal(v.ok, true);
    // ensure staged workspace isolation
    assert.ok(preview.includes('smart-pet-agent-pet-workspaces') || preview.includes('pet-workspaces'));
  });

  it('PET_TOOLS includes required tools for AIManager fallback', () => {
    const names = PET_TOOLS.map(t => t.name);
    assert.ok(names.includes('pet_normalize_input'));
    assert.ok(names.includes('pet_plan_states'));
    assert.ok(names.includes('pet_generate_assets'));
    assert.ok(names.includes('pet_validate'));
  });
});
