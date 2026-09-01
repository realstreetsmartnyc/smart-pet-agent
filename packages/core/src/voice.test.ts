import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentLoop } from './agent-loop.js';

describe('Voice scaffold', () => {
  it('generateVoice returns string and emits voice:generate', async () => {
    const agent = new AgentLoop({ aiProviders: {}, memoryPath: '/tmp/voice-'+Date.now()+'.db' });
    await agent.initialize();
    let emitted = false;
    agent.on('voice:generate', () => { emitted = true; });
    const gv = await (agent as any).generateVoice('hello');
    assert.equal(typeof gv, 'string');
    // generateVoice stub emits and returns "" — at least emits
    assert.equal(emitted, true);
  });
});
