// Smart-Pet-Agent — Memory Store (SQLite + Vector Search) with explicit test fallback
import Database from 'better-sqlite3';
import type { PermissionRecord } from './runtime-events.js';
import * as fs from 'fs';
export interface MemoryEntry { id?: number; input: string; response: string; mood: string; timestamp: number; embedding?: number[]; importance?: number; tags?: string[]; }
export interface AgentStateSnapshot { mood: string; energy: number; attention: number; learningRate: number; personalityTraits: Record<string, number>; }
export class MemoryStore {
  private db: InstanceType<typeof Database> | null = null;
  private path: string;
  private useMem = false;
  private memStore: MemoryEntry[] = [];
  private permStore: Map<string, PermissionRecord> = new Map();
  private providerStore: Map<string, any> = new Map();
  private taskStore: Map<string, any> = new Map();
  private auditStore: any[] = [];
  private agentState: AgentStateSnapshot | null = null;
  private fallbackReason: string | null = null;
  constructor(path: string) {
    this.path = path;
    if (process.env.SMART_PET_TEST === '1' || path.startsWith(':memory:') || path.includes('/tmp/voice-') || path.includes('/tmp/smoke-')) {
      this.useMem = true;
      this.fallbackReason = 'test memory path';
      return;
    }
    const candidates = ['/tmp/better-sqlite3-build/build/Release/better_sqlite3.node','/tmp/better-sqlite3-rebuild/build/Release/better_sqlite3.node'];
    try { this.db = new Database(path); } catch (e:any) {
      const errors = [`default binding: ${e?.message ?? String(e)}`];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try { this.db = new (Database as any)(path, { nativeBinding: p }); return; }
          catch (candidateError:any) { errors.push(`${p}: ${candidateError?.message ?? String(candidateError)}`); }
        }
      }
      this.fallbackReason = errors.join(' | ');
      if (process.env.SMART_PET_ALLOW_IN_MEMORY_FALLBACK !== '1') {
        throw new Error(`SQLite native binding unavailable for Smart Pet Agent persistence: ${this.fallbackReason}`);
      }
      this.useMem = true;
    }
  }
  isPersistent(): boolean { return !this.useMem; }
  getFallbackReason(): string | null { return this.fallbackReason; }
  async initialize(): Promise<void> { if (this.useMem) return; this.db!.exec(`CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY AUTOINCREMENT,input TEXT NOT NULL,response TEXT NOT NULL,mood TEXT NOT NULL,timestamp INTEGER NOT NULL,importance REAL DEFAULT 0.5,tags TEXT DEFAULT '[]');CREATE TABLE IF NOT EXISTS agent_state (id INTEGER PRIMARY KEY AUTOINCREMENT,data TEXT NOT NULL,timestamp INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS personality (trait TEXT PRIMARY KEY,value REAL NOT NULL,updated_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS permissions (device TEXT PRIMARY KEY,enabled INTEGER NOT NULL,mode TEXT NOT NULL,scope TEXT DEFAULT '[]',updated_at INTEGER NOT NULL,last_accessed INTEGER);CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT,event TEXT NOT NULL,device TEXT,action TEXT,detail TEXT,timestamp INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS provider_configs (key TEXT PRIMARY KEY,data TEXT NOT NULL,updated_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY,type TEXT NOT NULL,status TEXT NOT NULL,input TEXT NOT NULL,output TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);CREATE INDEX IF NOT EXISTS idx_memories_mood ON memories(mood);CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`); }
  async initializePermissions(): Promise<void> { if (this.useMem) return; this.db!.exec(`CREATE TABLE IF NOT EXISTS permissions (device TEXT PRIMARY KEY,enabled INTEGER NOT NULL,mode TEXT NOT NULL,scope TEXT DEFAULT '[]',updated_at INTEGER NOT NULL,last_accessed INTEGER);CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT,event TEXT NOT NULL,device TEXT,action TEXT,detail TEXT,timestamp INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS provider_configs (key TEXT PRIMARY KEY,data TEXT NOT NULL,updated_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY,type TEXT NOT NULL,status TEXT NOT NULL,input TEXT NOT NULL,output TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);`); }
  async store(entry: Omit<MemoryEntry, 'id'>): Promise<void> { if (this.useMem) { this.memStore.push({ ...entry, id: this.memStore.length+1 } as MemoryEntry); return; } const stmt=this.db!.prepare(`INSERT INTO memories (input, response, mood, timestamp, importance, tags) VALUES (?, ?, ?, ?, ?, ?)`); stmt.run(entry.input,entry.response,entry.mood,entry.timestamp,entry.importance??0.5,JSON.stringify(entry.tags??[])); }
  async searchRelevant(query: string, limit=5): Promise<MemoryEntry[]> { if (this.useMem) { const q=query.toLowerCase(); return this.memStore.filter(m=>m.input.toLowerCase().includes(q)||m.response.toLowerCase().includes(q)).slice(0,limit); } const stmt=this.db!.prepare(`SELECT * FROM memories WHERE input LIKE ? OR response LIKE ? ORDER BY importance DESC, timestamp DESC LIMIT ?`); const pattern=`%${query.split(' ').join('%')}%`; return stmt.all(pattern,pattern,limit) as MemoryEntry[]; }
  async getRecent(limit=20): Promise<MemoryEntry[]> { if (this.useMem) return [...this.memStore].sort((a,b)=>b.timestamp-a.timestamp).slice(0,limit); const stmt=this.db!.prepare(`SELECT * FROM memories ORDER BY timestamp DESC LIMIT ?`); return stmt.all(limit) as MemoryEntry[]; }
  async saveAgentState(state: AgentStateSnapshot): Promise<void> { if (this.useMem) { this.agentState=state; return; } const stmt=this.db!.prepare(`INSERT INTO agent_state (data, timestamp) VALUES (?, ?)`); stmt.run(JSON.stringify(state),Date.now()); }
  async getAgentState(): Promise<AgentStateSnapshot|null> { if (this.useMem) return this.agentState; const stmt=this.db!.prepare(`SELECT data FROM agent_state ORDER BY timestamp DESC LIMIT 1`); const row=stmt.get() as {data:string}|undefined; return row?JSON.parse(row.data):null; }
  async getPersonalityTraits(): Promise<Record<string, number>> { if (this.useMem) return {}; const stmt=this.db!.prepare(`SELECT trait, value FROM personality`); const rows=stmt.all() as {trait:string,value:number}[]; return Object.fromEntries(rows.map(r=>[r.trait,r.value])); }
  async updatePersonalityTrait(trait: string, value: number): Promise<void> { if (this.useMem) return; const stmt=this.db!.prepare(`INSERT INTO personality (trait, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(trait) DO UPDATE SET value = ?, updated_at = ?`); stmt.run(trait,value,Date.now(),value,Date.now()); }
  async getStats(): Promise<{total:number;firstDate:number;lastDate:number}> { if (this.useMem) return {total:this.memStore.length,firstDate:this.memStore[0]?.timestamp??0,lastDate:this.memStore[this.memStore.length-1]?.timestamp??0}; const stmt=this.db!.prepare(`SELECT COUNT(*) as total, MIN(timestamp) as firstDate, MAX(timestamp) as lastDate FROM memories`); return stmt.get() as any; }
  close(): void { if (this.useMem) return; try{this.db?.close();}catch{} }
  async savePermission(p: PermissionRecord): Promise<void> { if (this.useMem) { this.permStore.set(p.device,p); return; } const stmt=this.db!.prepare(`INSERT INTO permissions (device, enabled, mode, scope, updated_at, last_accessed) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(device) DO UPDATE SET enabled = excluded.enabled, mode = excluded.mode, scope = excluded.scope, updated_at = excluded.updated_at, last_accessed = excluded.last_accessed`); stmt.run(p.device,p.enabled?1:0,p.mode,JSON.stringify(p.scope??[]),p.updatedAt,p.lastAccessed??null); }
  async getPermission(device: string): Promise<PermissionRecord|null> { if (this.useMem) return this.permStore.get(device)??null; const stmt=this.db!.prepare(`SELECT device, enabled, mode, scope, updated_at, last_accessed FROM permissions WHERE device = ? LIMIT 1`); const row=stmt.get(device) as any; if(!row) return null; return {device:row.device,enabled:!!row.enabled,mode:row.mode,scope:JSON.parse(row.scope||'[]'),updatedAt:row.updated_at,lastAccessed:row.last_accessed??undefined}; }
  async listPermissions(): Promise<PermissionRecord[]> { if (this.useMem) return [...this.permStore.values()].sort((a,b)=>a.device.localeCompare(b.device)); const stmt=this.db!.prepare(`SELECT device, enabled, mode, scope, updated_at, last_accessed FROM permissions ORDER BY device ASC`); const rows=stmt.all() as any[]; return rows.map((row:any)=>({device:row.device,enabled:!!row.enabled,mode:row.mode,scope:JSON.parse(row.scope||'[]'),updatedAt:row.updated_at,lastAccessed:row.last_accessed??undefined})); }
  async logAudit(event: string, device: string|null, action: string|null, detail: string|null): Promise<void> { if (this.useMem) { this.auditStore.push({event,device,action,detail,timestamp:Date.now()}); return; } const stmt=this.db!.prepare(`INSERT INTO audit_logs (event, device, action, detail, timestamp) VALUES (?, ?, ?, ?, ?)`); stmt.run(event,device,action,detail,Date.now()); }
  async getAuditLogs(limit=50): Promise<any[]> { if (this.useMem) return [...this.auditStore].sort((a:any,b:any)=>b.timestamp-a.timestamp).slice(0,limit); const stmt=this.db!.prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`); return stmt.all(limit) as any; }
  async saveProviderConfig(key: string, data: any): Promise<void> { if (this.useMem) { this.providerStore.set(key,{key,data,updatedAt:Date.now()}); return; } const stmt=this.db!.prepare(`INSERT INTO provider_configs (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`); stmt.run(key,JSON.stringify(data),Date.now()); }
  async getProviderConfig(key: string): Promise<any|null> { if (this.useMem) { const r=this.providerStore.get(key); return r?r.data:null; } const stmt=this.db!.prepare(`SELECT data FROM provider_configs WHERE key=? LIMIT 1`); const row=stmt.get(key) as {data:string}|undefined; return row?JSON.parse(row.data):null; }
  async listProviderConfigs(): Promise<any[]> { if (this.useMem) return [...this.providerStore.values()]; const stmt=this.db!.prepare(`SELECT key, data, updated_at FROM provider_configs ORDER BY key ASC`); const rows=stmt.all() as any[]; return rows.map((r:any)=>({key:r.key,data:JSON.parse(r.data),updatedAt:r.updated_at})); }
  async createTask(id:string,type:string,input:string): Promise<void> { if (this.useMem) { const now=Date.now(); this.taskStore.set(id,{id,type,status:'pending',input,output:null,created_at:now,updated_at:now}); return; } const now=Date.now(); const stmt=this.db!.prepare(`INSERT INTO tasks (id, type, status, input, output, created_at, updated_at) VALUES (?, ?, 'pending', ?, NULL, ?, ?)`); stmt.run(id,type,input,now,now); }
  async updateTask(id:string,status:string,output?:string): Promise<void> { if (this.useMem) { const t=this.taskStore.get(id); if(t){ t.status=status; if(output) t.output=output; t.updated_at=Date.now(); } return; } const stmt=this.db!.prepare(`UPDATE tasks SET status=?, output=COALESCE(?, output), updated_at=? WHERE id=?`); stmt.run(status,output??null,Date.now(),id); }
  async listTasks(limit=50): Promise<any[]> { if (this.useMem) return [...this.taskStore.values()].sort((a:any,b:any)=>b.updated_at-a.updated_at).slice(0,limit); const stmt=this.db!.prepare(`SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?`); return stmt.all(limit) as any; }
  async getChatHistory(limit=50): Promise<any[]> { if (this.useMem) { const rows=[...this.memStore].sort((a,b)=>b.timestamp-a.timestamp).slice(0,limit); return rows.reverse().flatMap(r=>[{role:'user' as const,content:r.input,timestamp:r.timestamp},{role:'assistant' as const,content:r.response,timestamp:r.timestamp+1}]).slice(-limit); } const stmt=this.db!.prepare(`SELECT input, response, timestamp FROM memories ORDER BY timestamp DESC LIMIT ?`); const rows=stmt.all(limit) as any[]; return rows.reverse().flatMap((r:any)=>[{role:'user' as const,content:r.input,timestamp:r.timestamp},{role:'assistant' as const,content:r.response,timestamp:r.timestamp+1}]).slice(-limit); }
}
