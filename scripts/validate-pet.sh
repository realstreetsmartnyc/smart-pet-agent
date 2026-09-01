#!/bin/bash
set -e
echo "=== validate-pet ==="
node --import tsx -e "
import { validatePetPack } from './packages/core/src/pet-validator.ts';
import fs from 'fs';
import path from 'path';
const baseDir = 'pets/default-nyc-orb';
const m=JSON.parse(fs.readFileSync(path.join(baseDir,'manifest.json'),'utf8'));
const c=JSON.parse(fs.readFileSync(path.join(baseDir,'pet.config.json'),'utf8'));
const v1=validatePetPack(m,c);
console.log('canvas (no checkAssets):', v1);
if(!v1.ok) process.exit(1);
const v2=validatePetPack(m,c,{baseDir, checkAssets:true});
console.log('canvas (checkAssets):', v2);
if(!v2.ok) process.exit(1);
console.log('pet pack OK (canvas fallback)');
"
echo "=== validate-pet GREEN ==="
