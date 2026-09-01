import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mobileSmoke, MOBILE_CAPABILITIES } from '../apps/mobile/src/index.ts';
import { validatePetPack } from '../packages/core/src/pet-validator.ts';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const r = await mobileSmoke();
console.log('mobileSmoke:', r);
if (!r.ok) process.exit(1);
console.log('MOBILE_CAPABILITIES:', MOBILE_CAPABILITIES);
const m = JSON.parse(fs.readFileSync(join(ROOT, 'pets/default-nyc-orb/manifest.json'), 'utf8'));
const c = JSON.parse(fs.readFileSync(join(ROOT, 'pets/default-nyc-orb/pet.config.json'), 'utf8'));
const v = validatePetPack(m, c, { baseDir: 'pets/default-nyc-orb', checkAssets: true });
console.log('validatePetPack:', v.ok ? 'ok' : v);
if (!v.ok) process.exit(1);
console.log('mobile smoke: RuntimeEvent + validator headless PASS');
