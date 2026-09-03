// Smart-Pet-Agent Mobile — expo-sqlite MemoryStore adapter
// apps/mobile/src/memory-mobile.ts
// Mirrors packages/core/src/memory.ts interface using expo-sqlite instead of better-sqlite3

import * as SQLite from 'expo-sqlite';
import type { PermissionRecord } from '@smart-pet/core/runtime-events';
import type { SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'smart-pet-agent.db';

export interface MobileMemoryEntry {
  id?: number;
  input: string;
  response: string;
  mood: string;
  timestamp: number;
  importance?: number;
  tags?: string[];
}

export interface MobileAgentStateSnapshot {
  mood: string;
  energy: number;
  attention: number;
  learningRate: number;
  personalityTraits: Record<string, number>;
}

export class MobileMemoryStore {
  private db: SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        input TEXT NOT NULL,
        response TEXT NOT NULL,
        mood TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        importance REAL DEFAULT 0.5,
        tags TEXT DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS agent_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS personality (
        trait TEXT PRIMARY KEY,
        value REAL NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS permissions (
        device TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL,
        mode TEXT NOT NULL,
        scope TEXT DEFAULT '[]',
        updated_at INTEGER NOT NULL,
        last_accessed INTEGER
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        device TEXT,
        action TEXT,
        detail TEXT,
        timestamp INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS provider_configs (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        input TEXT NOT NULL,
        output TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);
      CREATE INDEX IF NOT EXISTS idx_memories_mood ON memories(mood);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);
  }

  async store(entry: Omit<MobileMemoryEntry, 'id'>): Promise<void> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    await this.db.runAsync(
      'INSERT INTO memories (input, response, mood, timestamp, importance, tags) VALUES (?, ?, ?, ?, ?, ?)',
      entry.input, entry.response, entry.mood, entry.timestamp, entry.importance ?? 0.5, JSON.stringify(entry.tags ?? [])
    );
  }

  async searchRelevant(query: string, limit = 5): Promise<MobileMemoryEntry[]> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    const pattern = `%${query.split(' ').join('%')}%`;
    const rows = await this.db.getAllAsync(
      'SELECT * FROM memories WHERE input LIKE ? OR response LIKE ? ORDER BY importance DESC, timestamp DESC LIMIT ?',
      pattern, pattern, limit
    );
    return rows as MobileMemoryEntry[];
  }

  async getRecent(limit = 20): Promise<MobileMemoryEntry[]> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    const rows = await this.db.getAllAsync(
      'SELECT * FROM memories ORDER BY timestamp DESC LIMIT ?',
      limit
    );
    return rows as MobileMemoryEntry[];
  }

  async saveAgentState(state: MobileAgentStateSnapshot): Promise<void> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    await this.db.runAsync(
      'INSERT INTO agent_state (data, timestamp) VALUES (?, ?)',
      JSON.stringify(state), Date.now()
    );
  }

  async getAgentState(): Promise<MobileAgentStateSnapshot | null> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    const row = await this.db.getFirstAsync<{ data: string }>(
      'SELECT data FROM agent_state ORDER BY timestamp DESC LIMIT 1'
    );
    return row ? JSON.parse(row.data) : null;
  }

  async savePermission(permission: PermissionRecord): Promise<void> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    await this.db.runAsync(
      `INSERT INTO permissions (device, enabled, mode, scope, updated_at, last_accessed)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(device) DO UPDATE SET
         enabled = excluded.enabled,
         mode = excluded.mode,
         scope = excluded.scope,
         updated_at = excluded.updated_at,
         last_accessed = excluded.last_accessed`,
      permission.device, permission.enabled ? 1 : 0, permission.mode, JSON.stringify(permission.scope ?? []), permission.updatedAt, permission.lastAccessed ?? null
    );
  }

  async getPermission(device: string): Promise<PermissionRecord | null> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    const row = await this.db.getFirstAsync<{
      device: string; enabled: number; mode: PermissionRecord['mode']; scope: string; updated_at: number; last_accessed: number | null;
    }>(
      'SELECT device, enabled, mode, scope, updated_at, last_accessed FROM permissions WHERE device = ? LIMIT 1',
      device
    );
    if (!row) return null;
    return {
      device: row.device,
      enabled: !!row.enabled,
      mode: row.mode,
      scope: JSON.parse(row.scope || '[]'),
      updatedAt: row.updated_at,
      lastAccessed: row.last_accessed ?? undefined,
    };
  }

  async listPermissions(): Promise<PermissionRecord[]> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    const rows = await this.db.getAllAsync<{
      device: string; enabled: number; mode: PermissionRecord['mode']; scope: string; updated_at: number; last_accessed: number | null;
    }>(
      'SELECT device, enabled, mode, scope, updated_at, last_accessed FROM permissions ORDER BY device ASC'
    );
    return rows.map((row) => ({
      device: row.device,
      enabled: !!row.enabled,
      mode: row.mode,
      scope: JSON.parse(row.scope || '[]'),
      updatedAt: row.updated_at,
      lastAccessed: row.last_accessed ?? undefined,
    }));
  }

  async logAudit(event: string, device: string | null, action: string | null, detail: string | null): Promise<void> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    await this.db.runAsync(
      'INSERT INTO audit_logs (event, device, action, detail, timestamp) VALUES (?, ?, ?, ?, ?)',
      event, device, action, detail, Date.now()
    );
  }

  async getAuditLogs(limit = 50): Promise<Array<{ id: number; event: string; device: string | null; action: string | null; detail: string | null; timestamp: number }>> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    return await this.db.getAllAsync(
      'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?',
      limit
    );
  }

  async saveProviderConfig(key: string, data: any): Promise<void> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    await this.db.runAsync(
      `INSERT INTO provider_configs (key, data, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      key, JSON.stringify(data), Date.now()
    );
  }

  async listProviderConfigs(): Promise<Array<{ key: string; data: any; updatedAt: number }>> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    const rows = await this.db.getAllAsync<{ key: string; data: string; updated_at: number }>(
      'SELECT key, data, updated_at FROM provider_configs ORDER BY key ASC'
    );
    return rows.map((r) => ({ key: r.key, data: JSON.parse(r.data), updatedAt: r.updated_at }));
  }

  async createTask(id: string, type: string, input: string): Promise<void> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    const now = Date.now();
    await this.db.runAsync(
      'INSERT INTO tasks (id, type, status, input, output, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?)',
      id, type, 'pending', input, now, now
    );
  }

  async updateTask(id: string, status: string, output?: string): Promise<void> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    await this.db.runAsync(
      'UPDATE tasks SET status = ?, output = COALESCE(?, output), updated_at = ? WHERE id = ?',
      status, output ?? null, Date.now(), id
    );
  }

  async listTasks(limit = 50): Promise<Array<{ id: string; type: string; status: string; input: string; output: string | null; created_at: number; updated_at: number }>> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    return await this.db.getAllAsync(
      'SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?',
      limit
    );
  }

  async getChatHistory(limit = 50): Promise<Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>> {
    if (!this.db) throw new Error('MemoryStore not initialized');
    const rows = await this.db.getAllAsync<{ input: string; response: string; timestamp: number }>(
      'SELECT input, response, timestamp FROM memories ORDER BY timestamp DESC LIMIT ?',
      limit
    );
    return rows
      .reverse()
      .flatMap((r) => [
        { role: 'user' as const, content: r.input, timestamp: r.timestamp },
        { role: 'assistant' as const, content: r.response, timestamp: r.timestamp + 1 },
      ])
      .slice(-limit);
  }

  async close(): Promise<void> {
    if (this.db) {
      try { await this.db.closeAsync(); } catch {}
      this.db = null;
    }
  }
}
