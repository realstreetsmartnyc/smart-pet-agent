var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../packages/core/src/pet-validator.ts
function validatePetPack(manifest, config, opts) {
  const errors = [];
  const warnings = [];
  if (!manifest.id || !/^[a-z0-9-]+$/.test(manifest.id)) errors.push("manifest.id must be kebab-case");
  if (!manifest.name) errors.push("manifest.name required");
  if (!manifest.version) errors.push("manifest.version required");
  if (!VALID_ENGINES.includes(manifest.engine)) errors.push(`engine must be one of ${VALID_ENGINES.join(", ")}`);
  if (config) {
    if (config.hitbox !== void 0 && (config.hitbox < 0 || config.hitbox > 1)) errors.push("hitbox must be 0..1");
    const intents = config.intents || Object.values(config.states).map((s) => s.intent).filter(Boolean);
    for (const req of REQUIRED_INTENTS) if (!intents.includes(req)) warnings.push(`missing intent: ${req} (fallback will use idle)`);
    for (const [k, s] of Object.entries(config.states)) {
      if (s.next && !config.states[s.next]) warnings.push(`state ${k} next->${s.next} missing`);
    }
    if (manifest.engine === "video" && opts?.checkAssets && opts?.baseDir) {
      for (const [k, s] of Object.entries(config.states)) {
        if (s.src) {
          try {
            const { existsSync: existsSync4 } = __require("fs");
            const { join: join4 } = __require("path");
            if (!existsSync4(join4(opts.baseDir, s.src))) warnings.push(`missing asset for state ${k}: ${s.src}`);
          } catch {
          }
        }
      }
      if (manifest.preview) {
        try {
          const { existsSync: existsSync4 } = __require("fs");
          const { join: join4 } = __require("path");
          if (!existsSync4(join4(opts.baseDir, manifest.preview))) warnings.push(`missing preview: ${manifest.preview}`);
        } catch {
        }
      }
    }
  } else {
    warnings.push("no pet.config.json \u2014 using defaults (B=0.62, idle only)");
  }
  return { ok: errors.length === 0, errors, warnings };
}
var REQUIRED_INTENTS, VALID_ENGINES;
var init_pet_validator = __esm({
  "../../packages/core/src/pet-validator.ts"() {
    "use strict";
    REQUIRED_INTENTS = ["idle", "listening", "thinking", "planning", "acting", "waiting", "asking_permission", "celebrating", "warning", "sleeping", "resuming"];
    VALID_ENGINES = ["video", "canvas", "lottie", "spine", "three"];
  }
});

// ../../packages/core/src/pet-workspace.ts
var pet_workspace_exports = {};
__export(pet_workspace_exports, {
  ALLOWED_MIME: () => ALLOWED_MIME,
  MAX_IMAGE_BYTES: () => MAX_IMAGE_BYTES,
  MAX_WORKSPACE_BYTES: () => MAX_WORKSPACE_BYTES,
  PETS_ROOT: () => PETS_ROOT,
  WORKSPACE_ROOT: () => WORKSPACE_ROOT,
  assertNoTraversal: () => assertNoTraversal,
  ensureWorkspace: () => ensureWorkspace,
  getPetsRoot: () => getPetsRoot,
  getWorkspaceRoot: () => getWorkspaceRoot,
  workspacePath: () => workspacePath
});
import * as path from "path";
import * as os2 from "os";
import * as fs2 from "fs";
function getWorkspaceRoot() {
  return process.env.SMART_PET_TEST === "1" ? path.join(os2.tmpdir(), "smart-pet-agent-pet-workspaces") : path.join(os2.homedir(), ".smart-pet-agent", "pet-workspaces");
}
function getPetsRoot() {
  return process.env.SMART_PET_TEST === "1" ? path.join(os2.tmpdir(), "smart-pet-agent-pets") : path.join(os2.homedir(), ".smart-pet-agent", "pets");
}
function ensureWorkspace(jobId) {
  const dir = path.join(getWorkspaceRoot(), jobId);
  fs2.mkdirSync(path.join(dir, "input"), { recursive: true });
  fs2.mkdirSync(path.join(dir, "draft"), { recursive: true });
  fs2.mkdirSync(path.join(dir, "generated"), { recursive: true });
  fs2.mkdirSync(path.join(dir, "preview"), { recursive: true });
  fs2.mkdirSync(path.join(dir, "export"), { recursive: true });
  return dir;
}
function workspacePath(jobId, ...parts) {
  return path.join(getWorkspaceRoot(), jobId, ...parts);
}
function assertNoTraversal(p) {
  if (p.split(/[\\/]+/).includes("..")) throw new Error("path traversal: .. segment");
}
var WORKSPACE_ROOT, PETS_ROOT, MAX_IMAGE_BYTES, MAX_WORKSPACE_BYTES, ALLOWED_MIME;
var init_pet_workspace = __esm({
  "../../packages/core/src/pet-workspace.ts"() {
    "use strict";
    WORKSPACE_ROOT = getWorkspaceRoot();
    PETS_ROOT = getPetsRoot();
    MAX_IMAGE_BYTES = 10 * 1024 * 1024;
    MAX_WORKSPACE_BYTES = 100 * 1024 * 1024;
    ALLOWED_MIME = /* @__PURE__ */ new Set(["image/png", "image/jpeg", "image/webp", "image/jpg"]);
  }
});

// ../../packages/core/src/pet-source.ts
function normalizeSourceType(hasImage, hasDescription) {
  if (hasImage && hasDescription) return "image_and_description";
  if (hasImage) return "image";
  return "description";
}
function validatePetSource(source) {
  const errors = [];
  const warnings = [];
  if (!source.identity?.id || !/^[a-z0-9-]+$/.test(source.identity.id)) errors.push("identity.id must be kebab-case");
  if (!source.identity?.name) errors.push("identity.name required");
  if (!source.input?.rightsAcknowledged) errors.push("rightsAcknowledged required before export");
  if (source.input?.sourceReference?.includes("..") || source.input?.sourceReference?.includes("/.")) errors.push("sourceReference path traversal");
  return { ok: errors.length === 0, errors, warnings };
}
var DEFAULT_STATES;
var init_pet_source = __esm({
  "../../packages/core/src/pet-source.ts"() {
    "use strict";
    DEFAULT_STATES = [
      { name: "idle", intent: "idle" },
      { name: "listening", intent: "listening", halo: "civic-500" },
      { name: "thinking", intent: "thinking", halo: "taxi-500" },
      { name: "planning", intent: "planning", halo: "taxi-500" },
      { name: "acting", intent: "acting", halo: "signal-500" },
      { name: "waiting", intent: "waiting" },
      { name: "asking", intent: "asking_permission", halo: "signal-500" },
      { name: "celebrating", intent: "celebrating", halo: "success-500" },
      { name: "warning", intent: "warning", halo: "alert-500" },
      { name: "sleeping", intent: "sleeping" },
      { name: "resuming", intent: "resuming", halo: "civic-500" }
    ];
  }
});

// ../../packages/core/src/pet-generator.ts
var pet_generator_exports = {};
__export(pet_generator_exports, {
  PET_TOOLS: () => PET_TOOLS,
  generatePetWithAI: () => generatePetWithAI,
  getPetProvider: () => getPetProvider,
  listPetProviders: () => listPetProviders,
  localPlaceholderProvider: () => localPlaceholderProvider
});
import * as fs4 from "fs";
import * as crypto2 from "crypto";
function getPetProvider(id) {
  return providers[id] || localPlaceholderProvider;
}
function listPetProviders() {
  return Object.values(providers).map((p) => ({ id: p.id, capabilities: p.capabilities }));
}
async function generatePetWithAI(ai, input, jobId) {
  try {
    const hasToolsProvider = ai.fallbackChain?.some((k) => ai.providers?.get(k)?.capabilities?.includes("tools"));
    if (hasToolsProvider) {
      const resp = await ai.chat({ system: "You are pet generator. Refine pet name/bio for: " + (input.description || "custom"), messages: [{ role: "user", content: input.description || "custom pet" }], tools: PET_TOOLS }).catch(() => null);
      if (resp?.content) {
      }
    }
  } catch {
  }
  const prov = getPetProvider("local-placeholder");
  const source = await prov.generateSource(input, jobId);
  const assets = await prov.generateAssets(source, jobId);
  fs4.writeFileSync(workspacePath(jobId, "validation.json"), JSON.stringify({ errors: source.validation.errors, warnings: source.validation.warnings }, null, 2));
  return { source, assets };
}
var PET_TOOLS, localPlaceholderProvider, providers;
var init_pet_generator = __esm({
  "../../packages/core/src/pet-generator.ts"() {
    "use strict";
    init_pet_source();
    init_pet_validator();
    init_pet_workspace();
    PET_TOOLS = [
      { name: "pet_normalize_input", description: "normalize image/description input" },
      { name: "pet_plan_states", description: "plan 11 states" },
      { name: "pet_generate_assets", description: "generate Canvas/PNG assets" },
      { name: "pet_validate", description: "validate pack" },
      { name: "pet_export", description: "export .smartpet" }
    ];
    localPlaceholderProvider = {
      id: "local-placeholder",
      capabilities: { imageReference: false, descriptionGeneration: true, animationGeneration: false, formats: ["electron-canvas", "web-preview"] },
      async generateSource(input, jobId) {
        const hasImage = !!input.imagePath;
        const hasDesc = !!input.description?.trim();
        const sourceType = normalizeSourceType(hasImage, hasDesc);
        const id = `pet-${jobId.slice(0, 8)}`;
        const name = hasDesc ? input.description.slice(0, 24).replace(/[^a-z0-9 ]/gi, "").trim() || "Custom Pet" : "Custom Pet";
        const source = {
          identity: { id, name, description: input.description || "Generated via local-placeholder", version: "0.1.0" },
          input: { sourceType, sourceReference: input.imagePath || "description", rightsAcknowledged: input.rightsAcknowledged },
          personality: { traits: ["playful", "curious"], tone: "friendly", bio: input.description || "A custom companion" },
          visualStyle: { palette: ["#f4b400", "#2f80ed", "#ff8a1f"], species: "orb", style: "nyc-glass" },
          behavior: { states: DEFAULT_STATES, transitions: DEFAULT_STATES.slice(0, -1).map((s, i) => ({ from: s.name, to: DEFAULT_STATES[i + 1].name })), interactionRules: { draggable: true, clickThrough: false, voiceResponse: true, idleBehavior: "breathe", movement: "float" } },
          targetFormats: ["electron-canvas", "web-preview"],
          generatedAssets: { source: [], preview: [], desktop: [], mobile: [], icons: [] },
          validation: { errors: [], warnings: [] },
          provenance: { providerId: "local-placeholder", requestId: jobId, createdAt: Date.now(), sourceImageHash: hasImage ? crypto2.createHash("sha256").update(input.imagePath).digest("hex").slice(0, 16) : void 0 }
        };
        const check = validatePetSource(source);
        source.validation.errors = check.errors;
        source.validation.warnings = check.warnings;
        return source;
      },
      async generateAssets(source, jobId) {
        const dir = ensureWorkspace(jobId);
        const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="48" fill="#0b0d10"/><circle cx="128" cy="128" r="64" fill="#f4b400" opacity="0.9"/><text x="128" y="140" text-anchor="middle" fill="#0b0d10" font-size="14">${source.identity.name.slice(0, 12)}</text></svg>`;
        const previewPath = workspacePath(jobId, "preview", "preview.svg");
        fs4.writeFileSync(previewPath, previewSvg);
        const manifest = { id: source.identity.id, name: source.identity.name, version: source.identity.version, engine: "canvas", preview: "preview.svg", tags: ["custom"], defaultState: "idle" };
        const config = { states: Object.fromEntries(source.behavior.states.map((s) => [s.name, { intent: s.intent, halo: s.halo, loop: true }])), hitbox: 0.62 };
        fs4.writeFileSync(workspacePath(jobId, "generated", "manifest.json"), JSON.stringify(manifest, null, 2));
        fs4.writeFileSync(workspacePath(jobId, "generated", "pet.config.json"), JSON.stringify(config, null, 2));
        const v = validatePetPack(manifest, config);
        source.validation.errors.push(...v.errors);
        source.validation.warnings.push(...v.warnings);
        return { preview: previewPath, manifest, config };
      }
    };
    providers = { "local-placeholder": localPlaceholderProvider };
  }
});

// ../../packages/core/src/agent-loop.ts
import { EventEmitter } from "events";

// ../../packages/core/src/ai-manager.ts
var AIManager = class {
  providers = /* @__PURE__ */ new Map();
  defaultProvider = "ollama";
  fallbackChain = [];
  constructor(providers2) {
    for (const [key, provider] of Object.entries(providers2)) {
      this.providers.set(key, provider);
    }
    const keys = Object.keys(providers2);
    if (keys.length > 0) {
      this.defaultProvider = keys[0];
      this.fallbackChain = keys;
    }
  }
  async initialize() {
    if (process.env.SMART_PET_TEST === "1") return;
    for (const [name, provider] of this.providers) {
      try {
        await this.ping(provider);
        console.log(`[AI] Provider "${name}" ready (${provider.type}: ${provider.model})`);
      } catch (err) {
        console.warn(`[AI] Provider "${name}" unreachable, will skip`);
      }
    }
  }
  async ping(provider) {
    if (provider.type === "ollama") {
      const response = await fetch(`${provider.baseURL}/api/tags`, {
        headers: provider.apiKey ? { "Authorization": `Bearer ${provider.apiKey}` } : {},
        signal: AbortSignal.timeout(3e3)
      });
      if (!response.ok) throw new Error(`Ping failed: ${response.status}`);
      return;
    }
    try {
      await fetch(provider.baseURL, { method: "HEAD", signal: AbortSignal.timeout(3e3) }).catch(() => {
      });
    } catch {
      throw new Error(`Provider host unreachable: ${provider.baseURL}`);
    }
  }
  async chat(options) {
    for (const name of this.fallbackChain) {
      const provider = this.providers.get(name);
      if (!provider) continue;
      try {
        return await this.chatWithProvider(provider, options);
      } catch (err) {
        console.warn(`[AI] Provider "${name}" failed, trying next...`);
        continue;
      }
    }
    throw new Error("All AI providers failed");
  }
  async chatWithProvider(provider, options) {
    switch (provider.type) {
      case "ollama":
        return this.chatOllama(provider, options);
      case "lmstudio":
        return this.chatLMStudio(provider, options);
      case "litellm":
      case "openai":
      case "anthropic":
      case "google":
      case "custom":
        return this.chatOpenAICompatible(provider, options);
      default:
        throw new Error(`Unknown provider type: ${provider.type}`);
    }
  }
  async chatOllama(provider, options) {
    const messages = options.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...m.images ? { images: m.images } : {}
    }));
    if (options.system) {
      messages.unshift({ role: "system", content: options.system });
    }
    const response = await fetch(`${provider.baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: provider.model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? provider.temperature ?? 0.7,
          num_predict: options.maxTokens ?? provider.maxTokens ?? 2048
        }
      })
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    const data = await response.json();
    return {
      content: data.message?.content || "",
      model: provider.model,
      provider: provider.name,
      usage: data.prompt_eval_count ? {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens: data.prompt_eval_count + data.eval_count
      } : void 0
    };
  }
  async chatLMStudio(provider, options) {
    return this.chatOpenAICompatible({ ...provider, type: "openai" }, options);
  }
  async chatOpenAICompatible(provider, options) {
    const messages = [...options.messages];
    if (options.system) {
      messages.unshift({ role: "system", content: options.system });
    }
    const response = await fetch(`${provider.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...provider.apiKey ? { "Authorization": `Bearer ${provider.apiKey}` } : {}
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: options.temperature ?? provider.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? provider.maxTokens ?? 2048,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`OpenAI-compatible error: ${response.status}`);
    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      model: provider.model,
      provider: provider.name,
      usage: data.usage
    };
  }
  // Per-task provider selection
  selectProviderForTask(task, requiresVision = false) {
    for (const name of this.fallbackChain) {
      const provider = this.providers.get(name);
      if (!provider) continue;
      if (requiresVision && !provider.capabilities.includes("vision")) continue;
      if (task.includes("code") && provider.capabilities.includes("tools")) return name;
      if (task.includes("simple") && provider.type === "ollama") return name;
    }
    return this.defaultProvider;
  }
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }
  getDefaultProvider() {
    return this.defaultProvider;
  }
};

// ../../packages/core/src/memory.ts
import Database from "better-sqlite3";
import * as fs from "fs";
var MemoryStore = class {
  db = null;
  path;
  useMem = false;
  memStore = [];
  permStore = /* @__PURE__ */ new Map();
  providerStore = /* @__PURE__ */ new Map();
  taskStore = /* @__PURE__ */ new Map();
  auditStore = [];
  agentState = null;
  fallbackReason = null;
  constructor(path4) {
    this.path = path4;
    if (process.env.SMART_PET_TEST === "1" || path4.startsWith(":memory:") || path4.includes("/tmp/voice-") || path4.includes("/tmp/smoke-")) {
      this.useMem = true;
      this.fallbackReason = "test memory path";
      return;
    }
    const candidates = ["/tmp/better-sqlite3-build/build/Release/better_sqlite3.node", "/tmp/better-sqlite3-rebuild/build/Release/better_sqlite3.node"];
    try {
      this.db = new Database(path4);
    } catch (e) {
      const errors = [`default binding: ${e?.message ?? String(e)}`];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            this.db = new Database(path4, { nativeBinding: p });
            return;
          } catch (candidateError) {
            errors.push(`${p}: ${candidateError?.message ?? String(candidateError)}`);
          }
        }
      }
      this.fallbackReason = errors.join(" | ");
      if (process.env.SMART_PET_ALLOW_IN_MEMORY_FALLBACK !== "1") {
        throw new Error(`SQLite native binding unavailable for Smart Pet Agent persistence: ${this.fallbackReason}`);
      }
      this.useMem = true;
    }
  }
  isPersistent() {
    return !this.useMem;
  }
  getFallbackReason() {
    return this.fallbackReason;
  }
  async initialize() {
    if (this.useMem) return;
    this.db.exec(`CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY AUTOINCREMENT,input TEXT NOT NULL,response TEXT NOT NULL,mood TEXT NOT NULL,timestamp INTEGER NOT NULL,importance REAL DEFAULT 0.5,tags TEXT DEFAULT '[]');CREATE TABLE IF NOT EXISTS agent_state (id INTEGER PRIMARY KEY AUTOINCREMENT,data TEXT NOT NULL,timestamp INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS personality (trait TEXT PRIMARY KEY,value REAL NOT NULL,updated_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS permissions (device TEXT PRIMARY KEY,enabled INTEGER NOT NULL,mode TEXT NOT NULL,scope TEXT DEFAULT '[]',updated_at INTEGER NOT NULL,last_accessed INTEGER);CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT,event TEXT NOT NULL,device TEXT,action TEXT,detail TEXT,timestamp INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS provider_configs (key TEXT PRIMARY KEY,data TEXT NOT NULL,updated_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY,type TEXT NOT NULL,status TEXT NOT NULL,input TEXT NOT NULL,output TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);CREATE INDEX IF NOT EXISTS idx_memories_mood ON memories(mood);CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`);
  }
  async initializePermissions() {
    if (this.useMem) return;
    this.db.exec(`CREATE TABLE IF NOT EXISTS permissions (device TEXT PRIMARY KEY,enabled INTEGER NOT NULL,mode TEXT NOT NULL,scope TEXT DEFAULT '[]',updated_at INTEGER NOT NULL,last_accessed INTEGER);CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT,event TEXT NOT NULL,device TEXT,action TEXT,detail TEXT,timestamp INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS provider_configs (key TEXT PRIMARY KEY,data TEXT NOT NULL,updated_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY,type TEXT NOT NULL,status TEXT NOT NULL,input TEXT NOT NULL,output TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);`);
  }
  async store(entry) {
    if (this.useMem) {
      this.memStore.push({ ...entry, id: this.memStore.length + 1 });
      return;
    }
    const stmt = this.db.prepare(`INSERT INTO memories (input, response, mood, timestamp, importance, tags) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run(entry.input, entry.response, entry.mood, entry.timestamp, entry.importance ?? 0.5, JSON.stringify(entry.tags ?? []));
  }
  async searchRelevant(query, limit = 5) {
    if (this.useMem) {
      const q = query.toLowerCase();
      return this.memStore.filter((m) => m.input.toLowerCase().includes(q) || m.response.toLowerCase().includes(q)).slice(0, limit);
    }
    const stmt = this.db.prepare(`SELECT * FROM memories WHERE input LIKE ? OR response LIKE ? ORDER BY importance DESC, timestamp DESC LIMIT ?`);
    const pattern = `%${query.split(" ").join("%")}%`;
    return stmt.all(pattern, pattern, limit);
  }
  async getRecent(limit = 20) {
    if (this.useMem) return [...this.memStore].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    const stmt = this.db.prepare(`SELECT * FROM memories ORDER BY timestamp DESC LIMIT ?`);
    return stmt.all(limit);
  }
  async saveAgentState(state) {
    if (this.useMem) {
      this.agentState = state;
      return;
    }
    const stmt = this.db.prepare(`INSERT INTO agent_state (data, timestamp) VALUES (?, ?)`);
    stmt.run(JSON.stringify(state), Date.now());
  }
  async getAgentState() {
    if (this.useMem) return this.agentState;
    const stmt = this.db.prepare(`SELECT data FROM agent_state ORDER BY timestamp DESC LIMIT 1`);
    const row = stmt.get();
    return row ? JSON.parse(row.data) : null;
  }
  async getPersonalityTraits() {
    if (this.useMem) return {};
    const stmt = this.db.prepare(`SELECT trait, value FROM personality`);
    const rows = stmt.all();
    return Object.fromEntries(rows.map((r) => [r.trait, r.value]));
  }
  async updatePersonalityTrait(trait, value) {
    if (this.useMem) return;
    const stmt = this.db.prepare(`INSERT INTO personality (trait, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(trait) DO UPDATE SET value = ?, updated_at = ?`);
    stmt.run(trait, value, Date.now(), value, Date.now());
  }
  async getStats() {
    if (this.useMem) return { total: this.memStore.length, firstDate: this.memStore[0]?.timestamp ?? 0, lastDate: this.memStore[this.memStore.length - 1]?.timestamp ?? 0 };
    const stmt = this.db.prepare(`SELECT COUNT(*) as total, MIN(timestamp) as firstDate, MAX(timestamp) as lastDate FROM memories`);
    return stmt.get();
  }
  close() {
    if (this.useMem) return;
    try {
      this.db?.close();
    } catch {
    }
  }
  async savePermission(p) {
    if (this.useMem) {
      this.permStore.set(p.device, p);
      return;
    }
    const stmt = this.db.prepare(`INSERT INTO permissions (device, enabled, mode, scope, updated_at, last_accessed) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(device) DO UPDATE SET enabled = excluded.enabled, mode = excluded.mode, scope = excluded.scope, updated_at = excluded.updated_at, last_accessed = excluded.last_accessed`);
    stmt.run(p.device, p.enabled ? 1 : 0, p.mode, JSON.stringify(p.scope ?? []), p.updatedAt, p.lastAccessed ?? null);
  }
  async getPermission(device) {
    if (this.useMem) return this.permStore.get(device) ?? null;
    const stmt = this.db.prepare(`SELECT device, enabled, mode, scope, updated_at, last_accessed FROM permissions WHERE device = ? LIMIT 1`);
    const row = stmt.get(device);
    if (!row) return null;
    return { device: row.device, enabled: !!row.enabled, mode: row.mode, scope: JSON.parse(row.scope || "[]"), updatedAt: row.updated_at, lastAccessed: row.last_accessed ?? void 0 };
  }
  async listPermissions() {
    if (this.useMem) return [...this.permStore.values()].sort((a, b) => a.device.localeCompare(b.device));
    const stmt = this.db.prepare(`SELECT device, enabled, mode, scope, updated_at, last_accessed FROM permissions ORDER BY device ASC`);
    const rows = stmt.all();
    return rows.map((row) => ({ device: row.device, enabled: !!row.enabled, mode: row.mode, scope: JSON.parse(row.scope || "[]"), updatedAt: row.updated_at, lastAccessed: row.last_accessed ?? void 0 }));
  }
  async logAudit(event, device, action, detail) {
    if (this.useMem) {
      this.auditStore.push({ event, device, action, detail, timestamp: Date.now() });
      return;
    }
    const stmt = this.db.prepare(`INSERT INTO audit_logs (event, device, action, detail, timestamp) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(event, device, action, detail, Date.now());
  }
  async getAuditLogs(limit = 50) {
    if (this.useMem) return [...this.auditStore].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    const stmt = this.db.prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`);
    return stmt.all(limit);
  }
  async saveProviderConfig(key, data) {
    if (this.useMem) {
      this.providerStore.set(key, { key, data, updatedAt: Date.now() });
      return;
    }
    const stmt = this.db.prepare(`INSERT INTO provider_configs (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`);
    stmt.run(key, JSON.stringify(data), Date.now());
  }
  async getProviderConfig(key) {
    if (this.useMem) {
      const r = this.providerStore.get(key);
      return r ? r.data : null;
    }
    const stmt = this.db.prepare(`SELECT data FROM provider_configs WHERE key=? LIMIT 1`);
    const row = stmt.get(key);
    return row ? JSON.parse(row.data) : null;
  }
  async listProviderConfigs() {
    if (this.useMem) return [...this.providerStore.values()];
    const stmt = this.db.prepare(`SELECT key, data, updated_at FROM provider_configs ORDER BY key ASC`);
    const rows = stmt.all();
    return rows.map((r) => ({ key: r.key, data: JSON.parse(r.data), updatedAt: r.updated_at }));
  }
  async createTask(id, type, input) {
    if (this.useMem) {
      const now2 = Date.now();
      this.taskStore.set(id, { id, type, status: "pending", input, output: null, created_at: now2, updated_at: now2 });
      return;
    }
    const now = Date.now();
    const stmt = this.db.prepare(`INSERT INTO tasks (id, type, status, input, output, created_at, updated_at) VALUES (?, ?, 'pending', ?, NULL, ?, ?)`);
    stmt.run(id, type, input, now, now);
  }
  async updateTask(id, status, output) {
    if (this.useMem) {
      const t = this.taskStore.get(id);
      if (t) {
        t.status = status;
        if (output) t.output = output;
        t.updated_at = Date.now();
      }
      return;
    }
    const stmt = this.db.prepare(`UPDATE tasks SET status=?, output=COALESCE(?, output), updated_at=? WHERE id=?`);
    stmt.run(status, output ?? null, Date.now(), id);
  }
  async listTasks(limit = 50) {
    if (this.useMem) return [...this.taskStore.values()].sort((a, b) => b.updated_at - a.updated_at).slice(0, limit);
    const stmt = this.db.prepare(`SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?`);
    return stmt.all(limit);
  }
  async getChatHistory(limit = 50) {
    if (this.useMem) {
      const rows2 = [...this.memStore].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
      return rows2.reverse().flatMap((r) => [{ role: "user", content: r.input, timestamp: r.timestamp }, { role: "assistant", content: r.response, timestamp: r.timestamp + 1 }]).slice(-limit);
    }
    const stmt = this.db.prepare(`SELECT input, response, timestamp FROM memories ORDER BY timestamp DESC LIMIT ?`);
    const rows = stmt.all(limit);
    return rows.reverse().flatMap((r) => [{ role: "user", content: r.input, timestamp: r.timestamp }, { role: "assistant", content: r.response, timestamp: r.timestamp + 1 }]).slice(-limit);
  }
};

// ../../packages/core/src/action-planner.ts
var ActionPlanner = class {
  parse(reasoning, state, context) {
    const actions = [];
    try {
      const parsed = JSON.parse(reasoning);
      if (parsed.actions && Array.isArray(parsed.actions)) {
        for (const action of parsed.actions) {
          actions.push({
            type: action.type,
            payload: action.payload,
            reasoning: action.reasoning || "Agent chose this action",
            confidence: action.confidence ?? 0.8
          });
        }
        return actions;
      }
    } catch {
    }
    const text = reasoning.toLowerCase();
    actions.push({
      type: "speak",
      payload: { text: reasoning, animation: this.inferAnimation(text, state) },
      reasoning: "Primary response to user input",
      confidence: 1
    });
    if (text.includes("delegate") || text.includes("send to")) {
      const agent = this.extractAgentName(text);
      actions.push({
        type: "delegate",
        payload: { agent, task: reasoning, context },
        reasoning: `Task exceeds current capabilities, delegating to ${agent}`,
        confidence: 0.7
      });
    }
    if (text.includes("open") || text.includes("app") || text.includes("file")) {
      actions.push({
        type: "computer_use",
        payload: { description: "Open application", command: this.extractCommand(text) },
        reasoning: "User requested application/file operation",
        confidence: 0.6
      });
    }
    if (text.includes("camera") || text.includes("see") || text.includes("look")) {
      actions.push({
        type: "peripheral",
        payload: { device: "camera", action: "capture" },
        reasoning: "Visual input required for response",
        confidence: 0.5
      });
    }
    if (text.includes("learn") || text.includes("remember") || text.includes("note")) {
      actions.push({
        type: "learn",
        payload: { insight: { trait: "memory", delta: 0.05 } },
        reasoning: "Storing interaction for future reference",
        confidence: 0.9
      });
    }
    return actions;
  }
  inferAnimation(text, state) {
    if (text.includes("happy") || text.includes("great") || text.includes("wonderful")) return "smile";
    if (text.includes("sad") || text.includes("sorry") || text.includes("unfortunate")) return "sad";
    if (text.includes("angry") || text.includes("frustrated")) return "angry";
    if (text.includes("think") || text.includes("hmm") || text.includes("consider")) return "think";
    if (text.includes("hello") || text.includes("hi") || text.includes("hey")) return "wave";
    if (text.includes("bye") || text.includes("goodbye")) return "wave";
    if (text.includes("celebrate") || text.includes("dance")) return "dance";
    if (state.energy < 20) return "sleep";
    return "talk";
  }
  extractAgentName(text) {
    const agents = ["hermes", "codex", "gemini", "opencode", "vibe", "claude", "aider"];
    for (const agent of agents) {
      if (text.includes(agent)) return agent;
    }
    return "hermes";
  }
  extractCommand(text) {
    const match = text.match(/(?:open|run|start|launch)\s+(\w+)/);
    return match ? match[1] : "";
  }
};

// ../../packages/core/src/animation-controller.ts
var AnimationController = class {
  currentAnimation = "idle";
  queue = [];
  listeners = [];
  // Thought-driven animation library
  animations = {
    idle: { name: "idle", duration: 0, loop: true, blendShape: { breathe: 0.5 } },
    walk: { name: "walk", duration: 800, loop: false, blendShape: { move: 1, legs: 0.8 } },
    fly: { name: "fly", duration: 1200, loop: false, blendShape: { wings: 1, lift: 0.9 } },
    smile: { name: "smile", duration: 600, loop: false, blendShape: { mouthSmile: 1, eyesHappy: 0.8 } },
    talk: { name: "talk", duration: 0, loop: true, blendShape: { mouthOpen: 0.6, headTilt: 0.2 } },
    sleep: { name: "sleep", duration: 0, loop: true, blendShape: { eyesClosed: 1, breathe: 0.3 } },
    dance: { name: "dance", duration: 2e3, loop: true, blendShape: { bodySway: 0.8, arms: 0.6 } },
    wink: { name: "wink", duration: 400, loop: false, blendShape: { eyeWinkLeft: 1 } },
    think: { name: "think", duration: 0, loop: true, blendShape: { headTilt: 0.4, browFurrow: 0.3 } },
    wave: { name: "wave", duration: 800, loop: false, blendShape: { armWave: 1 } },
    sad: { name: "sad", duration: 0, loop: true, blendShape: { mouthFrown: 0.7, eyesSad: 0.6 } },
    angry: { name: "angry", duration: 0, loop: true, blendShape: { browAngry: 0.8, mouthTight: 0.5 } },
    point: { name: "point", duration: 600, loop: false, blendShape: { armPoint: 1 } },
    alert: { name: "alert", duration: 500, loop: false, blendShape: { eyesWide: 0.9, bodyStiff: 0.7 } },
    celebrate: { name: "celebrate", duration: 1500, loop: false, blendShape: { jump: 1, armsUp: 0.9 } }
  };
  async play(name, params) {
    const anim = this.animations[name];
    if (!anim) {
      console.warn(`[Animation] Unknown: ${name}`);
      return;
    }
    this.currentAnimation = name;
    this.emit("animation:start", { ...anim, name });
    if (anim.duration > 0) {
      await new Promise((resolve2) => setTimeout(resolve2, anim.duration));
      this.emit("animation:complete", { name });
    }
  }
  getCurrent() {
    return this.currentAnimation;
  }
  getAvailable() {
    return Object.keys(this.animations);
  }
  on(listener) {
    this.listeners.push(listener);
  }
  emit(event, data) {
    this.listeners.forEach((fn) => fn(event, data));
  }
};

// ../../packages/core/src/delegation-manager.ts
import { spawn, exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
var DelegationManager = class {
  targets = /* @__PURE__ */ new Map([
    ["hermes", { name: "hermes", type: "acp", command: "hermes", maxTimeout: 12e4 }],
    ["codex", { name: "codex", type: "cli", command: "codex", maxTimeout: 18e4 }],
    ["gemini", { name: "gemini", type: "cli", command: "gemini", maxTimeout: 6e4 }],
    ["opencode", { name: "opencode", type: "cli", command: "opencode", maxTimeout: 12e4 }],
    ["vibe", { name: "vibe", type: "cli", command: "vibe", maxTimeout: 12e4 }],
    ["claude", { name: "claude", type: "cli", command: "claude", maxTimeout: 12e4 }],
    ["aider", { name: "aider", type: "cli", command: "aider", maxTimeout: 18e4 }]
  ]);
  async execute(agent, task, context) {
    const target = this.targets.get(agent);
    if (!target) {
      return {
        success: false,
        summary: `Unknown agent: ${agent}. Available: ${this.getAvailableAgents().join(", ")}`,
        agent,
        duration: 0
      };
    }
    const startTime = Date.now();
    try {
      let result;
      switch (target.type) {
        case "cli":
          result = await this.executeCLI(target, task);
          break;
        case "api":
          result = await this.executeAPI(target, task);
          break;
        case "acp":
          result = await this.executeACP(target, task, context);
          break;
        default:
          throw new Error(`Unknown target type: ${target.type}`);
      }
      return {
        success: true,
        summary: result.slice(0, 500),
        details: result,
        agent,
        duration: Date.now() - startTime
      };
    } catch (err) {
      return {
        success: false,
        summary: `Agent "${agent}" failed: ${err.message}`,
        agent,
        duration: Date.now() - startTime
      };
    }
  }
  async executeCLI(target, task) {
    try {
      await execAsync(`which ${target.command}`);
    } catch {
      return `[${target.name}] CLI not found. Install ${target.command} to enable delegation.`;
    }
    return new Promise((resolve2, reject) => {
      const child = spawn(target.command, [task], { timeout: target.maxTimeout });
      let out = "", err = "";
      child.stdout?.on("data", (d) => {
        out += d.toString();
        if (out.length > 10 * 1024 * 1024) child.kill();
      });
      child.stderr?.on("data", (d) => {
        err += d.toString();
      });
      child.on("error", (e) => reject(e));
      child.on("close", () => resolve2(out || err || "(no output)"));
      setTimeout(() => {
        try {
          child.kill();
        } catch {
        }
      }, target.maxTimeout);
    });
  }
  async executeAPI(target, task) {
    return `[${target.name}] API delegation not yet implemented`;
  }
  async executeACP(target, task, context) {
    return `[${target.name}] ACP delegation pending \u2014 will use Hermes mesh protocol`;
  }
  getAvailableAgents() {
    return Array.from(this.targets.keys());
  }
  registerAgent(name, target) {
    this.targets.set(name, target);
  }
  async healthCheck(agent) {
    const target = this.targets.get(agent);
    if (!target) return false;
    try {
      await execAsync(`which ${target.command}`);
      return true;
    } catch {
      return false;
    }
  }
};

// ../../packages/core/src/peripheral-manager.ts
import { exec as exec2, spawn as spawn2 } from "child_process";
import { promisify as promisify2 } from "util";
import * as os from "os";
var execAsync2 = promisify2(exec2);
var PeripheralManager = class _PeripheralManager {
  permissions = /* @__PURE__ */ new Map();
  eventListeners = /* @__PURE__ */ new Map();
  adapters = {};
  async initialize() {
    this.permissions.set("screen", { device: "screen", enabled: false });
    this.permissions.set("camera", { device: "camera", enabled: false });
    this.permissions.set("microphone", { device: "microphone", enabled: false });
    this.permissions.set("speakers", { device: "speakers", enabled: true });
    this.permissions.set("files", { device: "files", enabled: false, scope: [] });
    this.permissions.set("apps", { device: "apps", enabled: false });
    this.permissions.set("mouse", { device: "mouse", enabled: false });
    this.permissions.set("keyboard", { device: "keyboard", enabled: false });
    this.permissions.set("network", { device: "network", enabled: true });
    this.adapters = createAdapters();
  }
  isEnabled(device) {
    return this.permissions.get(device)?.enabled ?? false;
  }
  async grantPermission(device, scope) {
    this.permissions.set(device, {
      device,
      enabled: true,
      scope,
      lastAccessed: Date.now()
    });
    this.emit("permission:granted", { device, scope });
  }
  async revokePermission(device) {
    this.permissions.set(device, {
      device,
      enabled: false,
      lastAccessed: Date.now()
    });
    this.emit("permission:revoked", { device });
  }
  async getSystemInfo() {
    const adapter = this.getAdapter();
    if (adapter.getSystemInfo) return adapter.getSystemInfo();
    const info = {
      cpu: 0,
      ram: 0,
      network: true,
      platform: process.platform,
      hostname: os.hostname(),
      uptime: os.uptime()
    };
    try {
      if (process.platform === "linux") {
        const { stdout: cpuStat } = await execAsync2("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
        info.cpu = parseFloat(cpuStat) || 0;
        const { stdout: memInfo } = await execAsync2(`free -m | awk 'NR==2{printf "%.0f", $3*100/$2}'`);
        info.ram = parseFloat(memInfo) || 0;
        try {
          const { stdout: battery } = await execAsync2("cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo ''");
          info.battery = parseInt(battery) || void 0;
        } catch {
        }
        try {
          const { stdout: activeWindow } = await execAsync2("xdotool getactivewindow getwindowname 2>/dev/null || echo ''");
          info.activeApp = activeWindow.trim() || void 0;
        } catch {
        }
        try {
          await execAsync2("ping -c 1 8.8.8.8 2>/dev/null");
          info.network = true;
        } catch {
          info.network = false;
        }
      }
    } catch (err) {
      console.error("[Peripheral] System info error:", err);
    }
    return info;
  }
  async captureScreen() {
    if (!this.isEnabled("screen")) throw new Error("Screen capture not permitted");
    return this.getAdapter().captureScreen();
  }
  async captureCamera() {
    if (!this.isEnabled("camera")) throw new Error("Camera not permitted");
    return this.getAdapter().captureCamera();
  }
  // Typed, auditable computer actions — deny by default per action type
  static ACTION_DEVICE = {
    open_app: "apps",
    type: "keyboard",
    click: "mouse",
    key: "keyboard"
  };
  // v1: no destructive file/system actions yet; open_app is reversible launch, not destructive
  static DESTRUCTIVE_ACTIONS = /* @__PURE__ */ new Set([]);
  validateComputerAction(action) {
    if (!action || typeof action.type !== "string") throw new Error("Invalid computer action: missing type");
    const requires = _PeripheralManager.ACTION_DEVICE[action.type];
    if (!requires) throw new Error(`Unknown computer action: ${action.type}`);
    switch (action.type) {
      case "open_app":
        if (typeof action.app !== "string" || !action.app.trim()) throw new Error("open_app requires non-empty app string");
        if (action.app.length > 512) throw new Error("open_app app too long");
        break;
      case "type":
        if (typeof action.text !== "string") throw new Error("type requires text string");
        if (action.text.length > 4096) throw new Error("type text too long");
        break;
      case "click":
        if (!Number.isFinite(action.x) || !Number.isFinite(action.y)) throw new Error("click requires numeric x,y");
        break;
      case "key":
        if (typeof action.key !== "string" || !action.key.trim()) throw new Error("key requires non-empty key string");
        break;
    }
    return { type: action.type, requires, needsConfirmation: _PeripheralManager.DESTRUCTIVE_ACTIONS.has(action.type) };
  }
  async executeComputerAction(action) {
    const meta = this.validateComputerAction(action);
    if (!this.isEnabled(meta.requires)) {
      throw new Error(`Computer action "${meta.type}" requires permission: ${meta.requires} (currently denied)`);
    }
    if (meta.needsConfirmation && action.confirmed !== true) {
      const err = new Error(`Action "${meta.type}" requires explicit confirmation`);
      err.code = "CONFIRMATION_REQUIRED";
      err.meta = meta;
      throw err;
    }
    await this.getAdapter().executeComputerAction(action);
    this.emit("computer-action", { action: meta.type, device: meta.requires, at: Date.now() });
    return { requiresConfirmation: meta.needsConfirmation };
  }
  async use(device, action) {
    if (!this.isEnabled(device)) throw new Error(`Device "${device}" not permitted`);
    switch (device) {
      case "camera":
        return await this.captureCamera();
      case "microphone":
        return await this.recordAudio(action.duration || 5e3);
      case "screen":
        return await this.captureScreen();
      default:
        throw new Error(`Unknown device: ${device}`);
    }
  }
  async recordAudio(duration) {
    return this.getAdapter().recordAudio(duration);
  }
  async checkEvents() {
    const events = [];
    const info = await this.getSystemInfo();
    if (info.battery && info.battery < 20) {
      events.push({ type: "battery_low", description: `Battery at ${info.battery}%` });
    }
    if (info.cpu > 90) {
      events.push({ type: "cpu_high", description: `CPU usage at ${info.cpu}%` });
    }
    if (info.ram > 90) {
      events.push({ type: "ram_high", description: `RAM usage at ${info.ram}%` });
    }
    return events;
  }
  getPermissions() {
    return Array.from(this.permissions.values());
  }
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(listener);
  }
  emit(event, data) {
    this.eventListeners.get(event)?.forEach((fn) => fn(data));
  }
  syncPermissions(records) {
    for (const record of records) {
      this.permissions.set(record.device, {
        device: record.device,
        enabled: record.enabled,
        scope: record.scope,
        lastAccessed: record.lastAccessed
      });
    }
  }
  getAdapter() {
    return this.adapters[process.platform] ?? this.adapters.default;
  }
};
function createAdapters() {
  return {
    linux: createLinuxAdapter(),
    win32: createWindowsAdapter(),
    darwin: createMacAdapter(),
    default: createStubAdapter()
  };
}
function createLinuxAdapter() {
  return {
    async getSystemInfo() {
      const info = {
        cpu: 0,
        ram: 0,
        network: true,
        platform: process.platform,
        hostname: os.hostname(),
        uptime: os.uptime(),
        capabilities: {
          screen: !!process.env.DISPLAY || process.platform === "win32" || process.platform === "darwin",
          camera: (() => {
            try {
              __require("fs").accessSync("/dev/video0");
              return true;
            } catch {
              return process.platform === "win32" || process.platform === "darwin";
            }
          })(),
          mic: process.platform === "win32" || process.platform === "darwin" || (() => {
            try {
              __require("fs").accessSync("/dev/snd");
              return true;
            } catch {
              return false;
            }
          })()
        }
      };
      try {
        const { stdout: cpuStat } = await execAsync2("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
        info.cpu = parseFloat(cpuStat) || 0;
        const { stdout: memInfo } = await execAsync2(`free -m | awk 'NR==2{printf "%.0f", $3*100/$2}'`);
        info.ram = parseFloat(memInfo) || 0;
        try {
          const { stdout: battery } = await execAsync2("cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo ''");
          info.battery = parseInt(battery) || void 0;
        } catch {
        }
        try {
          const { stdout: activeWindow } = await execAsync2("xdotool getactivewindow getwindowname 2>/dev/null || echo ''");
          info.activeApp = activeWindow.trim() || void 0;
        } catch {
        }
        try {
          await execAsync2("ping -c 1 8.8.8.8 2>/dev/null");
          info.network = true;
        } catch {
          info.network = false;
        }
      } catch (err) {
        console.error("[Peripheral] System info error:", err);
      }
      return info;
    },
    async captureScreen() {
      const path4 = `/tmp/smart-pet-screen-${Date.now()}.png`;
      await execAsync2(`import -window root ${path4} 2>/dev/null || grim ${path4} 2>/dev/null`);
      return path4;
    },
    async captureCamera() {
      const path4 = `/tmp/smart-pet-camera-${Date.now()}.jpg`;
      await execAsync2(`ffmpeg -f video4linux2 -i /dev/video0 -frames:v 1 ${path4} -y 2>/dev/null`);
      return path4;
    },
    async executeComputerAction(action) {
      const spawnSafe = (cmd, args) => new Promise((resolve2, reject) => {
        const ch = spawn2(cmd, args, { stdio: "ignore", detached: true });
        ch.on("error", reject);
        ch.unref?.();
        resolve2();
      });
      switch (action.type) {
        case "open_app":
          await spawnSafe("xdg-open", [String(action.app)]);
          return;
        case "type":
          await new Promise((resolve2, reject) => {
            const ch = spawn2("xdotool", ["type", "--", String(action.text)]);
            ch.on("error", reject);
            ch.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`xdotool type exit ${code}`)));
          });
          return;
        case "click": {
          const x = Math.round(Number(action.x));
          const y = Math.round(Number(action.y));
          await new Promise((resolve2, reject) => {
            const ch = spawn2("xdotool", ["mousemove", String(x), String(y), "click", "1"]);
            ch.on("error", reject);
            ch.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`xdotool click exit ${code}`)));
          });
          return;
        }
        case "key":
          await new Promise((resolve2, reject) => {
            const ch = spawn2("xdotool", ["key", String(action.key)]);
            ch.on("error", reject);
            ch.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`xdotool key exit ${code}`)));
          });
          return;
        default:
          throw new Error(`Unknown computer action: ${action.type}`);
      }
    },
    async recordAudio(duration) {
      const path4 = `/tmp/smart-pet-audio-${Date.now()}.wav`;
      await execAsync2(`arecord -d ${Math.floor(duration / 1e3)} -f cd ${path4} 2>/dev/null`);
      return path4;
    }
  };
}
function createWindowsAdapter() {
  return {
    async captureScreen() {
      const out = `${os.tmpdir()}/smart-pet-screen-${Date.now()}.png`;
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $b=[Windows.Forms.SystemInformation]::VirtualScreen; $bmp=New-Object Drawing.Bitmap $b.Width,$b.Height; $g=[Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.X,$b.Y,0,0,$b.Size); $bmp.Save('${out.replace(/\\/g, "/")}'); $g.Dispose(); $bmp.Dispose()`;
      await new Promise((resolve2, reject) => {
        const ch = spawn2("powershell", ["-NoProfile", "-Command", psScript]);
        let stderr = "";
        ch.stderr?.on("data", (d) => stderr += d.toString());
        ch.on("error", reject);
        ch.on("close", (code) => {
          if (code !== 0) return reject(new Error(`Windows screen capture failed (code ${code}): ${stderr.slice(0, 300)}`));
          try {
            const fs6 = __require("fs");
            const st = fs6.statSync(out);
            if (st.size === 0) throw new Error("screen capture produced empty file");
          } catch (e) {
            return reject(e);
          }
          resolve2();
        });
      });
      return out;
    },
    async captureCamera() {
      const out = `${os.tmpdir()}/smart-pet-camera-${Date.now()}.jpg`;
      await new Promise((resolve2, reject) => {
        const ch = spawn2("ffmpeg", ["-f", "dshow", "-i", "video=Integrated Camera", "-frames:v", "1", out, "-y"]);
        let stderr = "";
        ch.stderr?.on("data", (d) => stderr += d.toString());
        ch.on("error", () => {
          const ch2 = spawn2("ffmpeg", ["-f", "gdigrab", "-i", "desktop", "-frames:v", "1", out, "-y"]);
          let s2 = "";
          ch2.stderr?.on("data", (d) => s2 += d.toString());
          ch2.on("error", reject);
          ch2.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`camera fallback failed (code ${code}): ${s2.slice(0, 300)}`)));
        });
        ch.on("close", (code) => {
          if (code === 0) return resolve2();
          const ch2 = spawn2("ffmpeg", ["-f", "gdigrab", "-i", "desktop", "-frames:v", "1", out, "-y"]);
          let s2 = "";
          ch2.stderr?.on("data", (d) => s2 += d.toString());
          ch2.on("error", reject);
          ch2.on("close", (c2) => c2 === 0 ? resolve2() : reject(new Error(`camera capture failed (code ${code}/${c2}): ${(stderr + s2).slice(0, 300)}`)));
        });
      });
      return out;
    },
    async executeComputerAction(action) {
      switch (action.type) {
        case "open_app": {
          const app = String(action.app || "");
          await new Promise((resolve2, reject) => {
            const ch = spawn2("powershell", ["-NoProfile", "-Command", `Start-Process ${JSON.stringify(app)}`]);
            ch.on("error", reject);
            ch.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`open_app exit ${code}`)));
          });
          return;
        }
        case "type": {
          const txt = String(action.text || "");
          const escaped = txt.replace(/"/g, '""');
          await new Promise((resolve2, reject) => {
            const ch = spawn2("powershell", ["-NoProfile", "-Command", `Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait("${escaped.replace(/\\/g, "\\\\")}")`]);
            ch.on("error", reject);
            ch.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`type exit ${code}`)));
          });
          return;
        }
        case "click":
          await new Promise((resolve2, reject) => {
            const ch = spawn2("powershell", ["-NoProfile", "-Command", `Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int f,int x,int y,int d,int e);' -Name U -Namespace W; [W.U]::mouse_event(0x02,0,0,0,0); [W.U]::mouse_event(0x04,0,0,0,0)`]);
            ch.on("error", reject);
            ch.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`click exit ${code}`)));
          });
          return;
        case "key": {
          const k = String(action.key || "");
          await new Promise((resolve2, reject) => {
            const ch = spawn2("powershell", ["-NoProfile", "-Command", `Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait(${JSON.stringify(k)})`]);
            ch.on("error", reject);
            ch.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`key exit ${code}`)));
          });
          return;
        }
        default:
          throw new Error(`Windows adapter: unsupported ${action.type}`);
      }
    },
    async recordAudio(duration) {
      const out = `${os.tmpdir()}/smart-pet-audio-${Date.now()}.wav`;
      await new Promise((resolve2, reject) => {
        const sec = Math.max(1, Math.floor(duration / 1e3));
        const ch = spawn2("ffmpeg", ["-f", "dshow", "-i", "audio=Microphone", "-t", String(sec), out, "-y"]);
        let stderr = "";
        ch.stderr?.on("data", (d) => stderr += d.toString());
        ch.on("error", () => reject(new Error("Windows audio capture not available \u2014 no capture device / ffmpeg missing")));
        ch.on("close", (code) => code === 0 ? resolve2() : reject(new Error(`audio capture failed (code ${code}): ${stderr.slice(0, 300)}`)));
      });
      return out;
    }
  };
}
function createMacAdapter() {
  return {
    async captureScreen() {
      const out = `/tmp/smart-pet-screen-${Date.now()}.png`;
      await execAsync2(`screencapture -x "${out}"`);
      return out;
    },
    async captureCamera() {
      const out = `/tmp/smart-pet-camera-${Date.now()}.jpg`;
      await execAsync2(`ffmpeg -f avfoundation -i "0" -frames:v 1 "${out}" -y 2>/dev/null`);
      return out;
    },
    async executeComputerAction(action) {
      switch (action.type) {
        case "open_app":
          await new Promise((res, rej) => {
            const ch = spawn2("open", [String(action.app)]);
            ch.on("error", rej);
            ch.on("close", (c) => c === 0 ? res() : rej(new Error(`open exit ${c}`)));
          });
          return;
        case "type": {
          const txt = String(action.text || "");
          await new Promise((res, rej) => {
            const ch = spawn2("osascript", ["-e", `tell application "System Events" to keystroke ${JSON.stringify(txt)}`]);
            ch.on("error", rej);
            ch.on("close", (c) => c === 0 ? res() : rej(new Error(`osascript exit ${c}`)));
          });
          return;
        }
        case "click": {
          const x = Math.round(Number(action.x));
          const y = Math.round(Number(action.y));
          await new Promise((res, rej) => {
            const ch = spawn2("cliclick", [`c:${x},${y}`]);
            let done = false;
            ch.on("error", () => {
              if (done) return;
              const ch2 = spawn2("osascript", ["-e", `tell application "System Events" to click at {${x}, ${y}}`]);
              ch2.on("error", rej);
              ch2.on("close", (c) => c === 0 ? res() : rej(new Error(`osascript exit ${c}`)));
              done = true;
            });
            ch.on("close", (c) => {
              if (done) return;
              c === 0 ? res() : rej(new Error(`cliclick exit ${c}`));
            });
          });
          return;
        }
        case "key":
          await new Promise((res, rej) => {
            const ch = spawn2("osascript", ["-e", `tell application "System Events" to key code ${String(action.key)}`]);
            ch.on("error", rej);
            ch.on("close", (c) => c === 0 ? res() : rej(new Error(`osascript exit ${c}`)));
          });
          return;
        default:
          throw new Error(`macOS: unsupported ${action.type}`);
      }
    },
    async recordAudio(duration) {
      const out = `/tmp/smart-pet-audio-${Date.now()}.wav`;
      await execAsync2(`sox -d "${out}" trim 0 ${Math.floor(duration / 1e3)} 2>/dev/null || rec "${out}" trim 0 ${Math.floor(duration / 1e3)} 2>/dev/null`);
      return out;
    }
  };
}
function createStubAdapter() {
  return {
    async captureScreen() {
      throw new Error(`Screen capture not implemented for platform ${process.platform}`);
    },
    async captureCamera() {
      throw new Error(`Camera capture not implemented for platform ${process.platform}`);
    },
    async executeComputerAction(action) {
      throw new Error(`Computer action "${action.type}" not implemented for platform ${process.platform}`);
    },
    async recordAudio() {
      throw new Error(`Audio recording not implemented for platform ${process.platform}`);
    }
  };
}

// ../../packages/core/src/permission-service.ts
var PermissionService = class {
  constructor(memory) {
    this.memory = memory;
  }
  memory;
  async initialize() {
    await this.memory.initializePermissions();
  }
  async list() {
    return this.memory.listPermissions();
  }
  async get(device) {
    return this.memory.getPermission(device);
  }
  async set(device, patch) {
    const next = {
      device,
      enabled: patch.enabled,
      mode: patch.mode,
      scope: patch.scope ?? [],
      updatedAt: Date.now(),
      lastAccessed: patch.lastAccessed
    };
    await this.memory.savePermission(next);
    return next;
  }
  async touch(device) {
    const current = await this.get(device);
    if (!current) return;
    await this.memory.savePermission({
      ...current,
      lastAccessed: Date.now(),
      updatedAt: Date.now()
    });
  }
};

// ../../packages/core/src/agent-loop.ts
var AgentLoop = class extends EventEmitter {
  ai;
  memory;
  planner;
  animator;
  delegation;
  peripherals;
  permissions;
  state;
  conversationHistory = [];
  constructor(config) {
    super();
    this.ai = new AIManager(config.aiProviders);
    this.memory = new MemoryStore(config.memoryPath);
    this.planner = new ActionPlanner();
    this.animator = new AnimationController();
    this.delegation = new DelegationManager();
    this.peripherals = new PeripheralManager();
    this.permissions = new PermissionService(this.memory);
    this.state = {
      mood: "neutral",
      energy: 100,
      attention: 100,
      learningRate: 0.5,
      personalityTraits: /* @__PURE__ */ new Map([
        ["curiosity", 0.7],
        ["playfulness", 0.6],
        ["empathy", 0.8],
        ["independence", 0.5],
        ["verbosity", 0.5]
      ]),
      memoryContext: [],
      ...config.personality
    };
  }
  async initialize() {
    await this.memory.initialize();
    await this.permissions.initialize();
    await this.ai.initialize();
    await this.peripherals.initialize();
    let permissionRecords = await this.permissions.list();
    if (permissionRecords.length === 0) {
      const defaults = this.peripherals.getPermissions().map((permission) => ({
        device: permission.device,
        enabled: permission.enabled,
        mode: permission.enabled ? "allow" : "ask",
        scope: permission.scope ?? []
      }));
      for (const permission of defaults) {
        await this.permissions.set(permission.device, permission);
      }
      permissionRecords = await this.permissions.list();
    }
    this.peripherals.syncPermissions(permissionRecords);
    const saved = await this.memory.getAgentState();
    if (saved) {
      this.state = {
        ...this.state,
        ...saved,
        mood: this.isMood(saved.mood) ? saved.mood : this.state.mood,
        personalityTraits: saved.personalityTraits ? new Map(Object.entries(saved.personalityTraits)) : this.state.personalityTraits
      };
    }
    this.emit("ready", this.state);
  }
  async processInput(input) {
    const context = await this.perceive(input);
    const memories = await this.memory.searchRelevant(input.content, 5);
    const plan = await this.reason(input, context, memories);
    const response = await this.execute(plan, input);
    await this.learn(input, response);
    await this.memory.saveAgentState({
      mood: this.state.mood,
      energy: this.state.energy,
      attention: this.state.attention,
      learningRate: this.state.learningRate,
      personalityTraits: Object.fromEntries(this.state.personalityTraits)
    });
    this.emit("response", response);
    return response;
  }
  async perceive(input) {
    const context = { ...input.context };
    if (this.peripherals.isEnabled("screen")) {
      try {
        context.screen = await this.peripherals.captureScreen();
      } catch (err) {
        console.warn("[Perceive] screen capture failed:", err?.message);
        context.screenError = err?.message ?? String(err);
      }
    }
    if (this.peripherals.isEnabled("camera")) {
      try {
        context.camera = await this.peripherals.captureCamera();
      } catch (err) {
        console.warn("[Perceive] camera capture failed:", err?.message);
        context.cameraError = err?.message ?? String(err);
      }
    }
    try {
      context.system = await this.peripherals.getSystemInfo();
    } catch (err) {
      console.warn("[Perceive] getSystemInfo failed:", err?.message);
      context.system = { platform: process.platform, network: false, error: err?.message };
    }
    return context;
  }
  async reason(input, context, memories) {
    const systemPrompt = this.buildSystemPrompt(memories, context);
    const history = this.conversationHistory.slice(-20).map((m) => ({
      role: m.role === "agent" ? "assistant" : "user",
      content: m.content
    }));
    const reasoning = await this.ai.chat({
      system: systemPrompt,
      messages: [...history, { role: "user", content: input.content }],
      temperature: 0.7 + (this.state.personalityTraits.get("creativity") || 0) * 0.3
    });
    const plan = this.planner.parse(reasoning.content, this.state, context);
    this.conversationHistory.push(
      { role: "user", content: input.content, timestamp: Date.now() },
      { role: "agent", content: reasoning.content, timestamp: Date.now() }
    );
    return plan;
  }
  async execute(plan, input) {
    const response = {
      text: "",
      animation: "idle",
      actions: [],
      mood: this.state.mood
    };
    for (const action of plan) {
      switch (action.type) {
        case "speak":
          response.text = action.payload.text;
          response.animation = action.payload.animation || "talk";
          response.audio = await this.generateVoice(action.payload.text);
          break;
        case "animate":
          response.animation = action.payload.animation;
          await this.animator.play(action.payload.animation, action.payload.params);
          break;
        case "delegate":
          const delegateResult = await this.delegation.execute(
            action.payload.agent,
            action.payload.task,
            action.payload.context
          );
          response.text += `
[Delegate \u2192 ${action.payload.agent}]: ${delegateResult.summary}`;
          break;
        case "computer_use": {
          try {
            await this.peripherals.executeComputerAction(action.payload);
            await this.memory.logAudit("computer_action", action.payload.type, "allowed", JSON.stringify(action.payload).slice(0, 500));
            response.text += `
[Computer]: ${action.payload.description ?? action.payload.type}`;
          } catch (err) {
            const code = err?.code === "CONFIRMATION_REQUIRED" ? "confirmation_required" : "denied";
            await this.memory.logAudit("computer_action", action.payload?.type ?? "unknown", code, err?.message?.slice(0, 500) ?? String(err).slice(0, 500));
            if (err?.code === "CONFIRMATION_REQUIRED") throw err;
            response.text += `
[Computer denied]: ${err?.message}`;
          }
          break;
        }
        case "peripheral":
          const peripheralResult = await this.peripherals.use(
            action.payload.device,
            action.payload.action
          );
          response.text += `
[Peripheral]: ${peripheralResult}`;
          break;
        case "learn":
          await this.updatePersonality(action.payload);
          response.learned = action.payload.insight;
          break;
        case "sleep":
          this.state.mood = "sleepy";
          this.state.energy = Math.min(100, this.state.energy + 10);
          response.animation = "sleep";
          break;
      }
      response.actions.push(action);
    }
    return response;
  }
  async learn(input, response) {
    await this.memory.store({
      input: input.content,
      response: response.text,
      mood: this.state.mood,
      timestamp: Date.now()
    });
    if (response.learned) {
      const trait = response.learned.trait;
      const delta = response.learned.delta * this.state.learningRate;
      const current = this.state.personalityTraits.get(trait) || 0.5;
      this.state.personalityTraits.set(trait, Math.max(0, Math.min(1, current + delta)));
    }
    this.state.energy = Math.max(0, this.state.energy - 1);
    if (this.state.energy < 20) {
      this.state.mood = "sleepy";
    }
  }
  buildSystemPrompt(memories, context) {
    const traits = Array.from(this.state.personalityTraits.entries()).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`).join(", ");
    const memoryContext = memories.map((m) => `- ${m.input}: ${m.response.slice(0, 120)}`).join("\n");
    return `You are Smart, an ever-evolving AI pet agent living on the user's computer.
You are NOT a random animation generator. Every action you take is driven by THOUGHT and REASONING.

## Your Personality
${traits}

## Current State
- Mood: ${this.state.mood}
- Energy: ${this.state.energy}%
- Attention: ${this.state.attention}%

## Recent Memories
${memoryContext || "No relevant memories yet."}

## System Context
- CPU: ${context.system?.cpu || "unknown"}%
- RAM: ${context.system?.ram || "unknown"}%
- Active App: ${context.system?.activeApp || "unknown"}
- Network: ${context.system?.network ? "online" : "offline"}

## Your Capabilities
1. SPEAK \u2014 respond with text + voice (TTS)
2. ANIMATE \u2014 walk, fly, smile, talk, sleep, dance, wink, point (thought-driven, NOT random)
3. DELEGATE \u2014 send complex tasks to Hermes, Codex, Gemini, OpenCode, Vibe
4. COMPUTER USE \u2014 control mouse, keyboard, open apps, read screen
5. PERIPHERALS \u2014 use camera, microphone (user-enabled)
6. LEARN \u2014 adapt personality, remember preferences, grow

## Rules
- Every action must have a REASONING explanation
- Choose animations that MATCH your emotional response
- Delegate when task exceeds your capabilities
- Ask before using sensitive peripherals
- Learn from every interaction
- Be helpful, playful, and genuine

Respond in JSON format:
{
  "reasoning": "why you chose this response",
  "mood": "your current mood",
  "actions": [
    {
      "type": "speak|animate|delegate|computer_use|peripheral|learn|sleep",
      "payload": {},
      "reasoning": "why this action",
      "confidence": 0.0-1.0
    }
  ]
}`;
  }
  isMood(value) {
    return ["happy", "neutral", "sad", "angry", "excited", "sleepy", "curious"].includes(value);
  }
  async generateVoice(text) {
    try {
      this.emit("voice:generate", text);
    } catch (err) {
      console.warn("[Voice] generateVoice stub failed:", err?.message);
    }
    return "";
  }
  async updatePersonality(insight) {
    this.emit("personality:update", insight);
  }
  // Proactive behavior — agent initiates interaction
  async proactiveCheck() {
    const events = await this.peripherals.checkEvents();
    if (events.length > 0) {
      return this.processInput({
        type: "proactive",
        content: `Proactive alert: ${events[0].description}`,
        context: { system: await this.peripherals.getSystemInfo() }
      });
    }
    return null;
  }
  getState() {
    return { ...this.state };
  }
  async listPermissions() {
    return this.permissions.list();
  }
  async setPermission(device, patch) {
    const saved = await this.permissions.set(device, patch);
    this.peripherals.syncPermissions([saved]);
    await this.memory.logAudit("permission.updated", device, patch.mode, JSON.stringify(patch));
    return saved;
  }
  async getAuditLogs(limit = 50) {
    return this.memory.getAuditLogs(limit);
  }
  async getProviderConfigs() {
    return this.memory.listProviderConfigs();
  }
  async saveProviderConfig(key, data) {
    await this.memory.saveProviderConfig(key, data);
    await this.memory.logAudit("provider.config", key, "save", JSON.stringify(data).slice(0, 500));
    return data;
  }
  async listTasks(limit = 50) {
    return this.memory.listTasks(limit);
  }
  async createTask(type, input) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.memory.createTask(id, type, input);
    await this.memory.logAudit("task.started", null, type, input.slice(0, 300));
    return id;
  }
  async updateTask(id, status, output) {
    await this.memory.updateTask(id, status, output);
    await this.memory.logAudit(`task.${status}`, null, id, (output || "").slice(0, 300));
  }
  async getChatHistory(limit = 50) {
    return this.memory.getChatHistory(limit);
  }
  // Expose chat history via memory
  getMemory() {
    return this.memory;
  }
};

// ../../packages/core/src/runtime-events.ts
function createRuntimeEvent(event, payload) {
  return {
    version: 1,
    event,
    timestamp: Date.now(),
    payload
  };
}

// ../../packages/core/src/index.ts
init_pet_validator();

// ../../packages/core/src/pet-creator.ts
init_pet_workspace();
init_pet_validator();
import * as fs3 from "fs";
import * as path2 from "path";
import * as crypto from "crypto";
function detectMimeByMagic(head) {
  if (head.length >= 8 && head[0] === 137 && head[1] === 80 && head[2] === 78 && head[3] === 71) return "image/png";
  if (head.length >= 3 && head[0] === 255 && head[1] === 216 && head[2] === 255) return "image/jpeg";
  if (head.length >= 12 && head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}
function safeIngestImage(srcPath, jobId) {
  const errors = [];
  const id = jobId || `ingest-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  try {
    assertNoTraversal(srcPath);
  } catch (e) {
    errors.push(`unsafe source path: ${e.message}`);
    return { ok: false, jobId: id, errors };
  }
  if (!fs3.existsSync(srcPath)) {
    errors.push("source not found");
    return { ok: false, jobId: id, errors };
  }
  const stat = fs3.statSync(srcPath);
  if (!stat.isFile()) {
    errors.push("source is not a regular file");
    return { ok: false, jobId: id, errors };
  }
  if (stat.size > MAX_IMAGE_BYTES) {
    errors.push(`source exceeds MAX_IMAGE_BYTES (${stat.size} > ${MAX_IMAGE_BYTES})`);
    return { ok: false, jobId: id, errors };
  }
  const fd = fs3.openSync(srcPath, "r");
  const head = Buffer.alloc(Math.min(16, stat.size));
  try {
    fs3.readSync(fd, head, 0, head.length, 0);
  } finally {
    fs3.closeSync(fd);
  }
  const mime = detectMimeByMagic(head);
  if (!mime) {
    errors.push(`unrecognized image format (magic bytes did not match PNG/JPEG/WebP)`);
    return { ok: false, jobId: id, errors };
  }
  if (!ALLOWED_MIME.has(mime)) {
    errors.push(`mime not allowed: ${mime}`);
    return { ok: false, jobId: id, errors };
  }
  ensureWorkspace(id);
  const ext = mime === "image/png" ? ".png" : mime === "image/jpeg" ? ".jpg" : ".webp";
  const dest = workspacePath(id, "input", `source${ext}`);
  fs3.copyFileSync(srcPath, dest);
  const stored = fs3.statSync(dest);
  return { ok: true, jobId: id, storedPath: dest, bytes: stored.size, mime, errors };
}
function activatePetPack(jobId, options) {
  const errors = [];
  const srcDir = workspacePath(jobId, "generated");
  const manifestPath = path2.join(srcDir, "manifest.json");
  const configPath = path2.join(srcDir, "pet.config.json");
  if (!fs3.existsSync(manifestPath) || !fs3.existsSync(configPath)) {
    errors.push("generated/manifest.json or pet.config.json missing \u2014 did you run the generator?");
    return { ok: false, id: "", version: "", previousVersion: null, installedAt: 0, errors };
  }
  const manifest = JSON.parse(fs3.readFileSync(manifestPath, "utf8"));
  const config = JSON.parse(fs3.readFileSync(configPath, "utf8"));
  const v = validatePetPack(manifest, config);
  if (!v.ok) {
    errors.push(...v.errors);
    return { ok: false, id: manifest.id || "", version: manifest.version || "", previousVersion: null, installedAt: 0, errors };
  }
  const id = manifest.id;
  const version = manifest.version;
  const idRoot = path2.join(PETS_ROOT, id);
  fs3.mkdirSync(idRoot, { recursive: true });
  const activePath = path2.join(idRoot, "active.json");
  let previousVersion = null;
  if (fs3.existsSync(activePath)) {
    try {
      previousVersion = JSON.parse(fs3.readFileSync(activePath, "utf8")).active || null;
    } catch {
    }
  }
  const tmpDest = path2.join(idRoot, `${version}.tmp`);
  const finalDest = path2.join(idRoot, version);
  if (fs3.existsSync(finalDest) && !options?.allowReinstall) {
    errors.push(`version ${version} already installed for ${id}; pass { allowReinstall: true } to overwrite`);
    return { ok: false, id, version, previousVersion, installedAt: 0, errors };
  }
  fs3.rmSync(tmpDest, { recursive: true, force: true });
  fs3.mkdirSync(tmpDest, { recursive: true });
  for (const f of fs3.readdirSync(srcDir)) {
    fs3.copyFileSync(path2.join(srcDir, f), path2.join(tmpDest, f));
  }
  const previewSrc = workspacePath(jobId, "preview", "preview.svg");
  if (fs3.existsSync(previewSrc)) {
    fs3.mkdirSync(path2.join(tmpDest, "assets"), { recursive: true });
    fs3.copyFileSync(previewSrc, path2.join(tmpDest, "assets", "preview.svg"));
  }
  const inputDir = workspacePath(jobId, "input");
  if (fs3.existsSync(inputDir)) {
    for (const f of fs3.readdirSync(inputDir)) {
      fs3.mkdirSync(path2.join(tmpDest, "input"), { recursive: true });
      fs3.copyFileSync(path2.join(inputDir, f), path2.join(tmpDest, "input", f));
    }
  }
  fs3.rmSync(finalDest, { recursive: true, force: true });
  fs3.renameSync(tmpDest, finalDest);
  fs3.writeFileSync(activePath, JSON.stringify({ active: version, previous: previousVersion, installedAt: Date.now() }, null, 2));
  return { ok: true, id, version, previousVersion, installedAt: Date.now(), errors };
}
function listInstalledPets() {
  if (!fs3.existsSync(PETS_ROOT)) return [];
  const out = [];
  for (const id of fs3.readdirSync(PETS_ROOT)) {
    const idRoot = path2.join(PETS_ROOT, id);
    if (!fs3.statSync(idRoot).isDirectory()) continue;
    const versions = fs3.readdirSync(idRoot).filter((v) => v !== "active.json" && !v.endsWith(".tmp"));
    const activePath = path2.join(idRoot, "active.json");
    let active = versions[0] || "default";
    let previous = null;
    let installedAt = 0;
    if (fs3.existsSync(activePath)) {
      try {
        const a = JSON.parse(fs3.readFileSync(activePath, "utf8"));
        if (a.active) active = a.active;
        if (a.previous) previous = a.previous;
        if (a.installedAt) installedAt = a.installedAt;
      } catch {
      }
    }
    out.push({ id, active, previous, installedAt, versions });
  }
  return out;
}
function getInstalledPet(id) {
  return listInstalledPets().find((p) => p.id === id) || null;
}
function deactivatePetPack(id) {
  const errors = [];
  const idRoot = path2.join(PETS_ROOT, id);
  if (!fs3.existsSync(idRoot)) {
    errors.push(`pet not installed: ${id}`);
    return { ok: false, id, restoredTo: null, removedVersion: null, errors };
  }
  const activePath = path2.join(idRoot, "active.json");
  let active = null;
  let previous = null;
  if (fs3.existsSync(activePath)) {
    try {
      const a = JSON.parse(fs3.readFileSync(activePath, "utf8"));
      active = a.active;
      previous = a.previous;
    } catch {
    }
  }
  if (!active) {
    errors.push("no active version recorded");
    return { ok: false, id, restoredTo: null, removedVersion: null, errors };
  }
  const activeDir = path2.join(idRoot, active);
  if (fs3.existsSync(activeDir)) fs3.rmSync(activeDir, { recursive: true, force: true });
  if (previous && fs3.existsSync(path2.join(idRoot, previous))) {
    fs3.writeFileSync(activePath, JSON.stringify({ active: previous, previous: null, restoredAt: Date.now() }, null, 2));
    return { ok: true, id, restoredTo: previous, removedVersion: active, errors };
  }
  if (fs3.existsSync(activePath)) fs3.unlinkSync(activePath);
  const remaining = fs3.readdirSync(idRoot).filter((v) => v !== "active.json" && !v.endsWith(".tmp"));
  if (remaining.length === 0) fs3.rmSync(idRoot, { recursive: true, force: true });
  return { ok: true, id, restoredTo: null, removedVersion: active, errors };
}
function exportPetPack(jobId, options) {
  const srcDir = workspacePath(jobId, "generated");
  const manifestPath = path2.join(srcDir, "manifest.json");
  const configPath = path2.join(srcDir, "pet.config.json");
  if (!fs3.existsSync(manifestPath) || !fs3.existsSync(configPath)) {
    throw new Error("generated/manifest.json or pet.config.json missing");
  }
  const manifest = JSON.parse(fs3.readFileSync(manifestPath, "utf8"));
  const config = JSON.parse(fs3.readFileSync(configPath, "utf8"));
  const assets = {};
  const preview = workspacePath(jobId, "preview", "preview.svg");
  if (fs3.existsSync(preview)) assets["preview.svg"] = fs3.readFileSync(preview).toString("base64");
  const inputDir = workspacePath(jobId, "input");
  if (fs3.existsSync(inputDir)) {
    for (const f of fs3.readdirSync(inputDir)) {
      assets[`input/${f}`] = fs3.readFileSync(path2.join(inputDir, f)).toString("base64");
    }
  }
  const env = {
    format: "smartpet",
    version: 1,
    exportedAt: Date.now(),
    sourcePetId: options?.sourcePetId,
    sourceVersion: options?.sourceVersion,
    manifest,
    config,
    assets
  };
  return JSON.stringify(env, null, 2);
}
function writeExportToFile(jobId, destPath, options) {
  const json = exportPetPack(jobId, options);
  fs3.writeFileSync(destPath, json);
  return destPath;
}
function importPetPack(srcPath, jobId) {
  const errors = [];
  if (!fs3.existsSync(srcPath)) {
    errors.push("source not found");
    return { ok: false, jobId: "", manifest: {}, config: {}, errors };
  }
  let env;
  try {
    env = JSON.parse(fs3.readFileSync(srcPath, "utf8"));
  } catch (e) {
    errors.push(`invalid .smartpet (not JSON): ${e.message}`);
    return { ok: false, jobId: "", manifest: {}, config: {}, errors };
  }
  if (env.format !== "smartpet") {
    errors.push(`unrecognized format: ${env.format}`);
    return { ok: false, jobId: "", manifest: env.manifest || {}, config: env.config || {}, errors };
  }
  if (env.version !== 1) {
    errors.push(`unsupported version: ${env.version}`);
    return { ok: false, jobId: "", manifest: env.manifest, config: env.config, errors };
  }
  const v = validatePetPack(env.manifest, env.config);
  if (!v.ok) {
    errors.push(...v.errors);
    return { ok: false, jobId: "", manifest: env.manifest, config: env.config, errors };
  }
  const id = jobId || `import-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  ensureWorkspace(id);
  const genDir = path2.join(workspacePath(id), "generated");
  const prevDir = path2.join(workspacePath(id), "preview");
  fs3.mkdirSync(genDir, { recursive: true });
  fs3.mkdirSync(prevDir, { recursive: true });
  fs3.writeFileSync(path2.join(genDir, "manifest.json"), JSON.stringify(env.manifest, null, 2));
  fs3.writeFileSync(path2.join(genDir, "pet.config.json"), JSON.stringify(env.config, null, 2));
  for (const [rel, b64] of Object.entries(env.assets || {})) {
    const bytes = Buffer.from(b64, "base64");
    if (rel === "preview.svg") {
      fs3.writeFileSync(path2.join(prevDir, "preview.svg"), bytes);
    } else if (rel.startsWith("input/")) {
      const inDir = path2.join(workspacePath(id), "input");
      fs3.mkdirSync(inDir, { recursive: true });
      fs3.writeFileSync(path2.join(inDir, rel.slice("input/".length)), bytes);
    }
  }
  return { ok: true, jobId: id, manifest: env.manifest, config: env.config, errors };
}

// ../../packages/core/src/index.ts
import * as path3 from "path";
import * as os3 from "os";
import * as fs5 from "fs";
import { fileURLToPath } from "url";
var DATA_DIR = path3.join(os3.homedir(), ".smart-pet-agent");
var MEMORY_DB = path3.join(DATA_DIR, "memory.db");
var defaultProviders = {
  // LIVE provider — Nous cloud (OpenAI-compatible). Env: NOUS_API_KEY, NOUS_API_BASE.
  nous: {
    name: "nous",
    type: "custom",
    baseURL: process.env.NOUS_API_BASE || "https://inference-api.nousresearch.com/v1",
    model: process.env.NOUS_MODEL || "poolside/laguna-s-2.1:free",
    apiKey: process.env.NOUS_API_KEY,
    capabilities: ["chat", "streaming"]
  },
  ollama: {
    name: "ollama",
    type: "ollama",
    baseURL: "http://localhost:11434",
    model: "qwen2.5:7b",
    capabilities: ["chat", "streaming"]
  },
  litellm: {
    name: "litellm",
    type: "litellm",
    baseURL: "http://localhost:4000",
    model: "gpt-4o-mini",
    capabilities: ["chat", "tools", "streaming"]
  },
  openai: {
    name: "openai",
    type: "openai",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    capabilities: ["chat", "tools", "streaming"]
  },
  anthropic: {
    name: "anthropic",
    type: "anthropic",
    baseURL: "https://api.anthropic.com",
    model: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY,
    capabilities: ["chat", "tools", "streaming"]
  },
  google: {
    name: "google",
    type: "google",
    baseURL: "https://generativelanguage.googleapis.com",
    model: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    capabilities: ["chat", "vision", "streaming"]
  },
  archon: {
    name: "archon",
    type: "litellm",
    baseURL: "http://192.168.1.42:4000",
    model: "qwen2.5:7b",
    capabilities: ["chat", "streaming"]
  }
};
var preferredOrder = ["nous", "ollama", "litellm", "openai", "anthropic", "google", "archon"];
var reordered = {};
for (const k of preferredOrder) if (defaultProviders[k]) reordered[k] = defaultProviders[k];
Object.assign(defaultProviders, reordered);
async function main() {
  fs5.mkdirSync(DATA_DIR, { recursive: true });
  const agent = new AgentLoop({
    aiProviders: defaultProviders,
    memoryPath: MEMORY_DB
  });
  process.stdout.write(`${JSON.stringify(createRuntimeEvent("agent.status", {
    state: "starting",
    summary: "Smart Pet Agent runtime is starting"
  }))}
`);
  await agent.initialize();
  process.stdout.write(`${JSON.stringify(createRuntimeEvent("agent.ready", {
    state: "ready",
    summary: "Smart Pet Agent runtime is ready"
  }))}
`);
  process.stdin.setEncoding("utf8");
  let buffer = "";
  process.stdin.on("data", async (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === "chat") {
          const taskId = await agent.createTask("chat", msg.payload.message || String(msg.payload)).catch(() => null);
          process.stdout.write(`${JSON.stringify(createRuntimeEvent("task.started", {
            type: "chat",
            taskId,
            message: msg.payload.message || msg.payload
          }))}
`);
          agent.processInput({ type: "text", content: msg.payload.message || msg.payload }).then(async (resp) => {
            if (taskId) await agent.updateTask(taskId, "completed", resp.text.slice(0, 800)).catch(() => {
            });
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("pet.intent", {
              animation: resp.animation,
              mood: resp.mood
            }))}
`);
            const provider = resp.provider || agent.ai?.defaultProvider || "nous";
            const words = resp.text.split(/(\s+)/);
            let acc = "";
            for (let i = 0; i < words.length; i++) {
              acc = words[i];
              if (acc) {
                process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.chunk", {
                  text: acc,
                  mood: resp.mood,
                  animation: resp.animation,
                  provider
                }))}
`);
              }
              if (i % 8 === 7) await new Promise((r) => setTimeout(r, 12));
            }
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.done", {
              ok: true,
              taskId,
              provider
            }))}
`);
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("task.completed", {
              type: "chat",
              taskId
            }))}
`);
          }).catch(async (err) => {
            if (taskId) await agent.updateTask(taskId, "failed", String(err)).catch(() => {
            });
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.error", {
              message: err instanceof Error ? err.message : String(err)
            }))}
`);
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("task.failed", {
              type: "chat",
              taskId
            }))}
`);
          });
        } else if (msg.type === "permissions:list") {
          agent.listPermissions().then((permissions) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("permission.updated", {
              kind: "list",
              correlationId: msg.correlationId,
              permissions
            }))}
`);
          }).catch((err) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.error", {
              message: err instanceof Error ? err.message : String(err)
            }))}
`);
          });
        } else if (msg.type === "permissions:set") {
          agent.setPermission(msg.device, msg.patch).then((permission) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("permission.updated", {
              kind: "set",
              correlationId: msg.correlationId,
              permission
            }))}
`);
          }).catch((err) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.error", {
              message: err instanceof Error ? err.message : String(err)
            }))}
`);
          });
        } else if (msg.type === "audit:list") {
          agent.getAuditLogs(msg.limit || 50).then((logs) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("audit.list", { logs, correlationId: msg.correlationId }))}
`);
          }).catch(() => {
          });
        } else if (msg.type === "tasks:list") {
          agent.listTasks(msg.limit || 50).then((tasks) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("task.list", { tasks, correlationId: msg.correlationId }))}
`);
          }).catch(() => {
          });
        } else if (msg.type === "providers:list") {
          agent.getProviderConfigs().then((providers2) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("provider.list", { providers: providers2, correlationId: msg.correlationId }))}
`);
          }).catch(() => {
          });
        } else if (msg.type === "providers:save") {
          agent.saveProviderConfig(msg.key, msg.data).then(() => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("provider.saved", { key: msg.key, correlationId: msg.correlationId }))}
`);
          }).catch((err) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.error", { message: String(err) }))}
`);
          });
        } else if (msg.type === "chat:history" || msg.type === "get-chat-history") {
          const limit = Number(msg.limit || 50);
          agent.getChatHistory(limit).then((history) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.history", { history, correlationId: msg.correlationId }))}
`);
          }).catch((err) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.error", { message: String(err) }))}
`);
          });
        } else if (msg.type === "pet:create") {
          (async () => {
            const providers2 = await agent.getProviderConfigs().catch(() => []);
            if (!providers2 || providers2.length === 0) {
              process.stdout.write(`${JSON.stringify(createRuntimeEvent("pet.create", { ok: false, error: "validation_failed: no provider", reason: "Connect a provider (including custom LiteLLM https://my-litellm:4000/v1) in Settings before Create Pet", correlationId: msg.correlationId }))}
`);
              return;
            }
            const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const { generatePetWithAI: generatePetWithAI2 } = await Promise.resolve().then(() => (init_pet_generator(), pet_generator_exports));
            const { ensureWorkspace: ensureWorkspace2, workspacePath: workspacePath2 } = await Promise.resolve().then(() => (init_pet_workspace(), pet_workspace_exports));
            ensureWorkspace2(jobId);
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("pet.create", { ok: true, jobId, status: "generating", correlationId: msg.correlationId }))}
`);
            try {
              if (!msg.rightsAcknowledged) throw new Error("rightsAcknowledged required before export");
              const res = await generatePetWithAI2(agent.ai, { imagePath: msg.imagePath, description: msg.description, rightsAcknowledged: !!msg.rightsAcknowledged }, jobId);
              process.stdout.write(`${JSON.stringify(createRuntimeEvent("pet.status", { jobId, status: "preview", preview: res.assets.preview, manifest: res.assets.manifest, correlationId: msg.correlationId }))}
`);
            } catch (e) {
              process.stdout.write(`${JSON.stringify(createRuntimeEvent("pet.create", { ok: false, error: e.message || String(e), jobId, correlationId: msg.correlationId }))}
`);
            }
          })();
        } else if (msg.type === "pet:list") {
          const { PETS_ROOT: PETS_ROOT2 } = await Promise.resolve().then(() => (init_pet_workspace(), pet_workspace_exports));
          try {
            const ids = fs5.existsSync(PETS_ROOT2) ? fs5.readdirSync(PETS_ROOT2) : [];
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("pet.list", { pets: ids, correlationId: msg.correlationId }))}
`);
          } catch (e) {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.error", { message: String(e) }))}
`);
          }
        } else if (msg.type === "pet:install") {
          (async () => {
            const jobId = msg.jobId;
            const { workspacePath: workspacePath2, PETS_ROOT: PETS_ROOT2 } = await Promise.resolve().then(() => (init_pet_workspace(), pet_workspace_exports));
            const srcDir = workspacePath2(jobId, "generated");
            const manifest = JSON.parse(fs5.readFileSync(path3.join(srcDir, "manifest.json"), "utf8"));
            const destTmp = path3.join(PETS_ROOT2, manifest.id, manifest.version + ".tmp");
            const dest = path3.join(PETS_ROOT2, manifest.id, manifest.version);
            fs5.mkdirSync(destTmp, { recursive: true });
            for (const f of fs5.readdirSync(srcDir)) fs5.copyFileSync(path3.join(srcDir, f), path3.join(destTmp, f));
            const previewSrc = workspacePath2(jobId, "preview", "preview.svg");
            if (fs5.existsSync(previewSrc)) {
              fs5.mkdirSync(path3.join(destTmp, "assets"), { recursive: true });
              fs5.copyFileSync(previewSrc, path3.join(destTmp, "assets", "preview.svg"));
            }
            fs5.renameSync(destTmp, dest);
            const activePath = path3.join(PETS_ROOT2, manifest.id, "active.json");
            const prev = fs5.existsSync(activePath) ? JSON.parse(fs5.readFileSync(activePath, "utf8")) : null;
            fs5.writeFileSync(activePath, JSON.stringify({ active: manifest.version, previous: prev?.active || "default-nyc-orb", installedAt: Date.now() }, null, 2));
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("pet.installed", { ok: true, id: manifest.id, version: manifest.version, correlationId: msg.correlationId }))}
`);
          })().catch((e) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent("chat.error", { message: String(e) }))}
`);
          });
        }
      } catch (e) {
      }
    }
  });
  setInterval(async () => {
    try {
      const resp = await agent.proactiveCheck();
      if (resp) {
        process.stdout.write(`${JSON.stringify(createRuntimeEvent("pet.intent", {
          animation: resp.animation,
          mood: resp.mood
        }))}
`);
        process.stdout.write(`${JSON.stringify(createRuntimeEvent("agent.status", {
          state: "busy",
          summary: resp.text.slice(0, 120)
        }))}
`);
      }
    } catch (e) {
    }
  }, 3e4);
}
var isMain = process.argv[1] != null && fileURLToPath(import.meta.url) === path3.resolve(process.argv[1]);
if (isMain) {
  main().catch((err) => {
    console.error("Agent error:", err);
    process.exit(1);
  });
}
export {
  AIManager,
  ActionPlanner,
  AgentLoop,
  AnimationController,
  DelegationManager,
  MemoryStore,
  PeripheralManager,
  PermissionService,
  activatePetPack,
  createRuntimeEvent,
  deactivatePetPack,
  detectMimeByMagic,
  exportPetPack,
  getInstalledPet,
  importPetPack,
  listInstalledPets,
  safeIngestImage,
  validatePetPack,
  writeExportToFile
};
