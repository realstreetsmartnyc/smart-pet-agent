#!/bin/bash
set -euo pipefail
echo "=== Smart Pet Agent smoke gate ==="
echo "[1/4] tokens single-source"
for f in apps/electron/dist/chat.html apps/electron/dist/index.html apps/electron/dist/pet-bubble.html apps/desktop/index.html; do
  if grep -q ":root" "$f" 2>/dev/null; then
    echo "FAIL $f has :root inline"; exit 1;
  fi
  if ! grep -q "tokens.css" "$f"; then echo "FAIL $f missing tokens.css"; exit 1; fi
done
echo "tokens OK"
echo "[2/4] pet pack validator"
node --import tsx -e "
import { validatePetPack } from './packages/core/src/pet-validator.ts';
import fs from 'fs';
const m=JSON.parse(fs.readFileSync('pets/default-nyc-orb/manifest.json','utf8'));
const c=JSON.parse(fs.readFileSync('pets/default-nyc-orb/pet.config.json','utf8'));
const v=validatePetPack(m,c);
console.log(v);
if(!v.ok) process.exit(1);
"
echo "pet pack OK"
echo "[3/4] headless agent"
node --import tsx -e "
import { AgentLoop } from './packages/core/src/agent-loop.ts';
import { DelegationManager } from './packages/core/src/delegation-manager.ts';
const agent = new AgentLoop({ aiProviders: {}, memoryPath: '/tmp/smoke-'+Date.now()+'.db' });
await agent.initialize();
const initialPermissions = await agent.listPermissions();
if (!initialPermissions.some((p) => p.device === 'camera' && p.mode === 'ask' && !p.enabled)) {
  throw new Error('permission defaults are not deny-by-default');
}
const changed = await agent.setPermission('camera', { enabled: true, mode: 'allow', scope: ['capture'] });
if (!changed.enabled || changed.mode !== 'allow') throw new Error('permission update failed');
const persisted = (await agent.listPermissions()).find((p) => p.device === 'camera');
if (!persisted?.enabled || persisted.mode !== 'allow') throw new Error('permission persistence failed');
const gv = await agent.generateVoice('hello');
if(typeof gv!=='string') throw new Error('generateVoice not string');
const ctx = await agent.perceive({ type: 'text', content: 'hi', context: {} });
if(!ctx.system) throw new Error('perceive no system');
const dm=new DelegationManager();
const r=await dm.executeCLI({ name:'echo', type:'cli', command:'echo', maxTimeout:5000 }, 'hello; echo pwned');
if(r.trim()!=='hello; echo pwned') throw new Error('delegation injection: '+JSON.stringify(r));
console.log('headless OK');
"
echo "[4/4] authoritative core typecheck"
pnpm typecheck
echo "typecheck OK"
echo "[5/5] packaged artifact"
if [ -f "apps/electron/build/linux-unpacked/resources/app.asar" ]; then
  echo "packaged app.asar OK";
  node -e "
    const asar = require('@electron/asar');
    const p = 'apps/electron/build/linux-unpacked/resources/app.asar';
    const files = asar.listPackage(p);
    const required = ['/node_modules/conf/package.json', '/node_modules/dot-prop/package.json'];
    const missing = required.filter((f) => !files.includes(f));
    if (missing.length) { console.error('asar missing dependencies: ' + missing.join(', ')); process.exit(1); }
    console.log('asar dependency closure OK (conf + dot-prop)');
  " || { echo "FAIL asar missing conf/dot-prop"; exit 1; }
else echo "SKIP packaged (no build yet)"; fi
echo "[6/6] test suite"
pnpm test
echo "tests OK"
echo "[7/7] mobile"
bash scripts/mobile-smoke.sh
echo "mobile OK"
echo "=== SMOKE GATE GREEN ==="
