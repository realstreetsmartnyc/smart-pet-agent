import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';

// Exercises real packages/core/src/index.ts as a child via NDJSON, not a simulated buffer.
// This is the Sprint 2 live-bridge gate: proves RuntimeEvent framing, agent.ready, and chat round-trip
// use the same code path that Electron's main.js uses (stdin → stdout NDJSON).

function spawnAgent(extraEnv: Record<string,string> = {}) {
  const rootDir = path.resolve(import.meta.dirname ?? '.', '../../..');
  const entry = path.join(rootDir, 'packages/core/src/index.ts');
  const child = spawn(process.execPath, ['--import', 'tsx', entry], {
    cwd: rootDir,
    env: { ...process.env, ...extraEnv, NODE_ENV: 'development' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return child;
}

function waitForEvent(child: any, eventName: string, timeoutMs = 6000): Promise<any> {
  return new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${eventName}`)), timeoutMs);
    const onData = (data: Buffer) => {
      buf += data.toString();
      let idx: number;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        let evt: any;
        try { evt = JSON.parse(line); } catch { continue; }
        if (evt.event === eventName) {
          clearTimeout(timer);
          child.stdout.off('data', onData);
          resolve(evt);
        }
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', () => {}); // ignore logs
  });
}

describe('Runtime bridge (real child via NDJSON)', () => {
  it('child emits agent.ready on startup', async () => {
    const child = spawnAgent({ SMART_PET_TEST: '1' });
    try {
      const ready = await waitForEvent(child, 'agent.ready', 8000);
      assert.equal(ready.event, 'agent.ready');
      assert.equal(ready.version, 1);
    } finally {
      child.kill();
    }
  });

  it('child handles get-chat-history and chat:history round-trip', async () => {
    const child = spawnAgent();
    try {
      await waitForEvent(child, 'agent.ready', 8000);
      // Ask for history via NDJSON (same shape as main.js invokeGenericRpc)
      const req = JSON.stringify({ type: 'chat:history', limit: 5, correlationId: 'test-123' }) + '\n';
      child.stdin.write(req);
      const hist = await waitForEvent(child, 'chat.history', 4000);
      assert.ok(Array.isArray(hist.payload.history));
      assert.equal(hist.payload.correlationId, 'test-123');
    } finally {
      child.kill();
    }
  });
});
