#!/usr/bin/env node
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'smart-pet-sqlite-'));
const dbPath = path.join(profile, 'memory.db');
const candidateBindings = [
  process.env.SMART_PET_SQLITE_NATIVE_BINDING,
  '/tmp/better-sqlite3-build/build/Release/better_sqlite3.node',
  '/tmp/better-sqlite3-rebuild/build/Release/better_sqlite3.node',
].filter(Boolean);

function openDatabase(file) {
  const errors = [];
  try {
    return { db: new Database(file), binding: 'default' };
  } catch (error) {
    errors.push(`default: ${error instanceof Error ? error.message : String(error)}`);
  }

  for (const binding of candidateBindings) {
    if (!fs.existsSync(binding)) continue;
    try {
      return { db: new Database(file, { nativeBinding: binding }), binding };
    } catch (error) {
      errors.push(`${binding}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(errors.join(' | '));
}

try {
  const opened = openDatabase(dbPath);
  const db = opened.db;
  db.exec('CREATE TABLE permissions (device TEXT PRIMARY KEY, enabled INTEGER NOT NULL)');
  db.prepare('INSERT INTO permissions (device, enabled) VALUES (?, ?)').run('camera', 1);
  db.close();

  const reopenedResult = openDatabase(dbPath);
  const reopened = reopenedResult.db;
  const row = reopened.prepare('SELECT enabled FROM permissions WHERE device = ?').get('camera');
  reopened.close();

  if (!row || row.enabled !== 1) {
    throw new Error('permission row did not persist after reopening SQLite database');
  }

  console.log(JSON.stringify({
    ok: true,
    nodeAbi: process.versions.modules,
    electronAbi: process.versions.electron ?? null,
    sqlite: 'better-sqlite3',
    binding: opened.binding,
    dbPath,
  }));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    nodeAbi: process.versions.modules,
    electronAbi: process.versions.electron ?? null,
    message: error instanceof Error ? error.message : String(error),
  }));
  process.exit(1);
}
