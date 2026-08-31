// Smart-Pet-Agent Core — Public Exports
// packages/core/src/index.ts

// Export the agent loop for Electron to spawn as child process
export { AgentLoop } from './agent-loop.js';
export type { AgentState, UserInput, AgentAction, AgentResponse } from './agent-loop.js';

export { AIManager } from './ai-manager.js';
export type { AIProvider, ChatMessage, ChatOptions, ChatResponse } from './ai-manager.js';

export { MemoryStore } from './memory.js';
export type { MemoryEntry, AgentStateSnapshot } from './memory.js';

export { ActionPlanner } from './action-planner.js';
export { AnimationController } from './animation-controller.js';
export type { AnimationState } from './animation-controller.js';

export { DelegationManager } from './delegation-manager.js';
export type { DelegationTarget, DelegationResult } from './delegation-manager.js';

export { PeripheralManager } from './peripheral-manager.js';
export type { PeripheralPermission, SystemInfo } from './peripheral-manager.js';
export { PermissionService } from './permission-service.js';
export { createRuntimeEvent } from './runtime-events.js';
export type { RuntimeEvent, RuntimeEventName, PermissionRecord } from './runtime-events.js';
export { validatePetPack } from './pet-validator.js';

// When run as: node index.ts or npx tsx index.ts
// This is the standalone agent runner — reads commands from stdin as JSON lines
import { AgentLoop } from './agent-loop.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { createRuntimeEvent } from './runtime-events.js';

const DATA_DIR = path.join(os.homedir(), '.smart-pet-agent');
const MEMORY_DB = path.join(DATA_DIR, 'memory.db');

const defaultProviders = {
  // LIVE provider — Nous cloud (OpenAI-compatible). Env: NOUS_API_KEY, NOUS_API_BASE.
  nous: {
    name: 'nous', type: 'custom', baseURL: process.env.NOUS_API_BASE || 'https://inference-api.nousresearch.com/v1',
    model: process.env.NOUS_MODEL || 'poolside/laguna-s-2.1:free',
    apiKey: process.env.NOUS_API_KEY,
    capabilities: ['chat', 'streaming'],
  },
  ollama: {
    name: 'ollama', type: 'ollama', baseURL: 'http://localhost:11434',
    model: 'qwen2.5:7b', capabilities: ['chat', 'streaming'],
  },
  litellm: {
    name: 'litellm', type: 'litellm', baseURL: 'http://localhost:4000',
    model: 'gpt-4o-mini', capabilities: ['chat', 'tools', 'streaming'],
  },
  openai: {
    name: 'openai', type: 'openai', baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini', apiKey: process.env.OPENAI_API_KEY,
    capabilities: ['chat', 'tools', 'streaming'],
  },
  anthropic: {
    name: 'anthropic', type: 'anthropic', baseURL: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-20241022', apiKey: process.env.ANTHROPIC_API_KEY,
    capabilities: ['chat', 'tools', 'streaming'],
  },
  google: {
    name: 'google', type: 'google', baseURL: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.0-flash', apiKey: process.env.GOOGLE_API_KEY,
    capabilities: ['chat', 'vision', 'streaming'],
  },
  archon: {
    name: 'archon', type: 'litellm', baseURL: 'http://192.168.1.42:4000',
    model: 'qwen2.5:7b', capabilities: ['chat', 'streaming'],
  },
};

// Set Nous first in the fallback chain so the chat round-trip succeeds out of the box.
const preferredOrder = ['nous', 'ollama', 'litellm', 'openai', 'anthropic', 'google', 'archon'];
const reordered: Record<string, any> = {};
for (const k of preferredOrder) if ((defaultProviders as any)[k]) reordered[k] = (defaultProviders as any)[k];
Object.assign(defaultProviders, reordered);

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const agent = new AgentLoop({
    aiProviders: defaultProviders,
    memoryPath: MEMORY_DB,
  });

  process.stdout.write(`${JSON.stringify(createRuntimeEvent('agent.status', {
    state: 'starting',
    summary: 'Smart Pet Agent runtime is starting',
  }))}\n`);
  await agent.initialize();
  process.stdout.write(`${JSON.stringify(createRuntimeEvent('agent.ready', {
    state: 'ready',
    summary: 'Smart Pet Agent runtime is ready',
  }))}\n`);

  // Read JSON lines from stdin
  process.stdin.setEncoding('utf8');
  let buffer = '';
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === 'chat') {
          const taskId = await agent.createTask('chat', msg.payload.message || String(msg.payload)).catch(() => null);
          process.stdout.write(`${JSON.stringify(createRuntimeEvent('task.started', {
            type: 'chat',
            taskId,
            message: msg.payload.message || msg.payload,
          }))}\n`);
          agent.processInput({ type: 'text', content: msg.payload.message || msg.payload })
            .then(async resp => {
              if (taskId) await agent.updateTask(taskId, 'completed', resp.text.slice(0, 800)).catch(() => {});
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('pet.intent', {
                animation: resp.animation,
                mood: resp.mood,
              }))}\n`);
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('chat.chunk', {
                text: resp.text,
                mood: resp.mood,
                animation: resp.animation,
              }))}\n`);
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('chat.done', {
                ok: true,
                taskId,
              }))}\n`);
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('task.completed', {
                type: 'chat',
                taskId,
              }))}\n`);
            })
            .catch(async (err) => {
              if (taskId) await agent.updateTask(taskId, 'failed', String(err)).catch(() => {});
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('chat.error', {
                message: err instanceof Error ? err.message : String(err),
              }))}\n`);
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('task.failed', {
                type: 'chat',
                taskId,
              }))}\n`);
            });
        } else if (msg.type === 'permissions:list') {
          agent.listPermissions()
            .then((permissions) => {
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('permission.updated', {
                kind: 'list',
                correlationId: msg.correlationId,
                permissions,
              }))}\n`);
            })
            .catch((err) => {
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('chat.error', {
                message: err instanceof Error ? err.message : String(err),
              }))}\n`);
            });
        } else if (msg.type === 'permissions:set') {
          agent.setPermission(msg.device, msg.patch)
            .then((permission) => {
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('permission.updated', {
                kind: 'set',
                correlationId: msg.correlationId,
                permission,
              }))}\n`);
            })
            .catch((err) => {
              process.stdout.write(`${JSON.stringify(createRuntimeEvent('chat.error', {
                message: err instanceof Error ? err.message : String(err),
              }))}\n`);
            });
        } else if (msg.type === 'audit:list') {
          agent.getAuditLogs(msg.limit || 50).then((logs) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent('audit.list' as any, { logs, correlationId: msg.correlationId } as any))}\n`);
          }).catch(() => {});
        } else if (msg.type === 'tasks:list') {
          agent.listTasks(msg.limit || 50).then((tasks) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent('task.list' as any, { tasks, correlationId: msg.correlationId } as any))}\n`);
          }).catch(() => {});
        } else if (msg.type === 'providers:list') {
          agent.getProviderConfigs().then((providers) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent('provider.list' as any, { providers, correlationId: msg.correlationId } as any))}\n`);
          }).catch(() => {});
        } else if (msg.type === 'providers:save') {
          agent.saveProviderConfig(msg.key, msg.data).then(() => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent('provider.saved' as any, { key: msg.key, correlationId: msg.correlationId } as any))}\n`);
          }).catch((err) => {
            process.stdout.write(`${JSON.stringify(createRuntimeEvent('chat.error', { message: String(err) }))}\n`);
          });
        }
      } catch (e) {
        // ignore
      }
    }
  });

  // Proactive check
  setInterval(async () => {
    try {
      const resp = await agent.proactiveCheck();
      if (resp) {
        process.stdout.write(`${JSON.stringify(createRuntimeEvent('pet.intent', {
          animation: resp.animation,
          mood: resp.mood,
        }))}\n`);
        process.stdout.write(`${JSON.stringify(createRuntimeEvent('agent.status', {
          state: 'busy',
          summary: resp.text.slice(0, 120),
        }))}\n`);
      }
    } catch (e) { /* ignore proactive errors */ }
  }, 30000);
}

// Run if this is the entry point (ESM-safe)
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(err => {
    console.error('Agent error:', err);
    process.exit(1);
  });
}
