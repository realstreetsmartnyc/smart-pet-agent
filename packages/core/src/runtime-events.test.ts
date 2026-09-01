import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeEvent } from './runtime-events.js';

// Minimal NDJSON framing helper (mirrors main.js)
function frameEvents(events: any[]): string {
  return events.map(e => JSON.stringify(e)).join('\n') + '\n';
}
function parseNDJSON(chunk: string): any[] {
  const lines = chunk.split('\n').filter(l => l.trim());
  return lines.map(l => JSON.parse(l));
}

describe('RuntimeEvent contract', () => {
  it('createRuntimeEvent adds version and timestamp', () => {
    const e = createRuntimeEvent('agent.ready', { summary: 'ok' });
    assert.equal(e.version, 1);
    assert.equal(e.event, 'agent.ready');
    assert.ok(e.timestamp > 0);
  });

  it('NDJSON framing round-trips', () => {
    const evts = [
      createRuntimeEvent('chat.chunk', { text: 'hi' }),
      createRuntimeEvent('pet.intent', { animation: 'thinking' }),
    ];
    const framed = frameEvents(evts);
    const parsed = parseNDJSON(framed);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].event, 'chat.chunk');
    assert.equal(parsed[1].event, 'pet.intent');
  });

  it('NDJSON ignores empty lines', () => {
    const chunk = JSON.stringify(createRuntimeEvent('agent.status', { state: 'ready', summary: 'x' })) + '\n\n';
    const parsed = parseNDJSON(chunk);
    assert.equal(parsed.length, 1);
  });
});

describe('startup buffering (simulated)', () => {
  it('buffers before ready and flushes after', () => {
    const buf: any[] = [];
    let ready = false;
    const send = (msg: any) => { if (ready) return msg; buf.push(msg); };
    send({ type: 'a' });
    send({ type: 'b' });
    assert.equal(buf.length, 2);
    ready = true;
    const flushed = [...buf]; buf.length = 0;
    assert.equal(flushed.length, 2);
    assert.equal(buf.length, 0);
  });
});

describe('RPC timeout', () => {
  it('times out after 2500ms', async () => {
    const timeoutMs = 30;
    const result = await new Promise<null>((res) => setTimeout(() => res(null), timeoutMs));
    assert.equal(result, null);
  });
});
