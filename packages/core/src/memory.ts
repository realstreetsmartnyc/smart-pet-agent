// Smart-Pet-Agent — Memory Store (SQLite + Vector Search)
// packages/core/src/memory.ts

import Database from 'better-sqlite3';
import type { PermissionRecord } from './runtime-events.js';

export interface MemoryEntry {
  id?: number;
  input: string;
  response: string;
  mood: string;
  timestamp: number;
  embedding?: number[];
  importance?: number;
  tags?: string[];
}

export interface AgentStateSnapshot {
  mood: string;
  energy: number;
  attention: number;
  learningRate: number;
  personalityTraits: Record<string, number>;
}

export class MemoryStore {
  private db: Database;
  private path: string;

  constructor(path: string) {
    this.path = path;
    this.db = new Database(path);
  }

  async initialize(): Promise<void> {
    this.db.exec(`
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

  async initializePermissions(): Promise<void> {
    this.db.exec(`
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
    `);
  }

  async store(entry: Omit<MemoryEntry, 'id'>): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO memories (input, response, mood, timestamp, importance, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.input,
      entry.response,
      entry.mood,
      entry.timestamp,
      entry.importance ?? 0.5,
      JSON.stringify(entry.tags ?? [])
    );
  }

  async searchRelevant(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    // Simple keyword search (upgrade to vector later)
    const stmt = this.db.prepare(`
      SELECT * FROM memories
      WHERE input LIKE ? OR response LIKE ?
      ORDER BY importance DESC, timestamp DESC
      LIMIT ?
    `);
    const pattern = `%${query.split(' ').join('%')}%`;
    return stmt.all(pattern, pattern, limit) as MemoryEntry[];
  }

  async getRecent(limit: number = 20): Promise<MemoryEntry[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM memories ORDER BY timestamp DESC LIMIT ?
    `);
    return stmt.all(limit) as MemoryEntry[];
  }

  async saveAgentState(state: AgentStateSnapshot): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO agent_state (data, timestamp) VALUES (?, ?)
    `);
    stmt.run(JSON.stringify(state), Date.now());
  }

  async getAgentState(): Promise<AgentStateSnapshot | null> {
    const stmt = this.db.prepare(`
      SELECT data FROM agent_state ORDER BY timestamp DESC LIMIT 1
    `);
    const row = stmt.get() as { data: string } | undefined;
    return row ? JSON.parse(row.data) : null;
  }

  async getPersonalityTraits(): Promise<Record<string, number>> {
    const stmt = this.db.prepare(`SELECT trait, value FROM personality`);
    const rows = stmt.all() as { trait: string; value: number }[];
    return Object.fromEntries(rows.map(r => [r.trait, r.value]));
  }

  async updatePersonalityTrait(trait: string, value: number): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO personality (trait, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(trait) DO UPDATE SET value = ?, updated_at = ?
    `);
    stmt.run(trait, value, Date.now(), value, Date.now());
  }

  async getStats(): Promise<{ total: number; firstDate: number; lastDate: number }> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as total, MIN(timestamp) as firstDate, MAX(timestamp) as lastDate
      FROM memories
    `);
    return stmt.get() as any;
  }

  close(): void {
    this.db.close();
  }

  async savePermission(permission: PermissionRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO permissions (device, enabled, mode, scope, updated_at, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(device) DO UPDATE SET
        enabled = excluded.enabled,
        mode = excluded.mode,
        scope = excluded.scope,
        updated_at = excluded.updated_at,
        last_accessed = excluded.last_accessed
    `);
    stmt.run(
      permission.device,
      permission.enabled ? 1 : 0,
      permission.mode,
      JSON.stringify(permission.scope ?? []),
      permission.updatedAt,
      permission.lastAccessed ?? null,
    );
  }

  async getPermission(device: string): Promise<PermissionRecord | null> {
    const stmt = this.db.prepare(`
      SELECT device, enabled, mode, scope, updated_at, last_accessed
      FROM permissions
      WHERE device = ?
      LIMIT 1
    `);
    const row = stmt.get(device) as
      | {
          device: string;
          enabled: number;
          mode: PermissionRecord['mode'];
          scope: string;
          updated_at: number;
          last_accessed: number | null;
        }
      | undefined;
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
    const stmt = this.db.prepare(`
      SELECT device, enabled, mode, scope, updated_at, last_accessed
      FROM permissions
      ORDER BY device ASC
    `);
    const rows = stmt.all() as Array<{
      device: string;
      enabled: number;
      mode: PermissionRecord['mode'];
      scope: string;
      updated_at: number;
      last_accessed: number | null;
    }>;
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
    const stmt = this.db.prepare(`INSERT INTO audit_logs (event, device, action, detail, timestamp) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(event, device, action, detail, Date.now());
  }

  async getAuditLogs(limit = 50): Promise<Array<{ id: number; event: string; device: string | null; action: string | null; detail: string | null; timestamp: number }>> {
    const stmt = this.db.prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`);
    return stmt.all(limit) as any;
  }

  async saveProviderConfig(key: string, data: any): Promise<void> {
    const stmt = this.db.prepare(`INSERT INTO provider_configs (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`);
    stmt.run(key, JSON.stringify(data), Date.now());
  }

  async getProviderConfig(key: string): Promise<any | null> {
    const stmt = this.db.prepare(`SELECT data FROM provider_configs WHERE key=? LIMIT 1`);
    const row = stmt.get(key) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : null;
  }

  async listProviderConfigs(): Promise<Array<{ key: string; data: any; updatedAt: number }>> {
    const stmt = this.db.prepare(`SELECT key, data, updated_at FROM provider_configs ORDER BY key ASC`);
    const rows = stmt.all() as Array<{ key: string; data: string; updated_at: number }>;
    return rows.map((r) => ({ key: r.key, data: JSON.parse(r.data), updatedAt: r.updated_at }));
  }

  async createTask(id: string, type: string, input: string): Promise<void> {
    const now = Date.now();
    const stmt = this.db.prepare(`INSERT INTO tasks (id, type, status, input, output, created_at, updated_at) VALUES (?, ?, 'pending', ?, NULL, ?, ?)`);
    stmt.run(id, type, input, now, now);
  }

  async updateTask(id: string, status: string, output?: string): Promise<void> {
    const stmt = this.db.prepare(`UPDATE tasks SET status=?, output=COALESCE(?, output), updated_at=? WHERE id=?`);
    stmt.run(status, output ?? null, Date.now(), id);
  }

  async listTasks(limit = 50): Promise<Array<{ id: string; type: string; status: string; input: string; output: string | null; created_at: number; updated_at: number }>> {
    const stmt = this.db.prepare(`SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?`);
    return stmt.all(limit) as any;
  }
}
