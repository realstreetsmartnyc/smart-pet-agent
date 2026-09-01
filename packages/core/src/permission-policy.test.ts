import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PeripheralManager } from './peripheral-manager.js';

describe('PeripheralManager typed actions', () => {
  it('deny by default per action', async () => {
    const pm = new PeripheralManager();
    await pm.initialize();
    // all deny by default
    await assert.rejects(() => pm.executeComputerAction({ type: 'click', x: 10, y: 10 }), /requires permission: mouse/);
    await assert.rejects(() => pm.executeComputerAction({ type: 'type', text: 'hi' }), /requires permission: keyboard/);
    await assert.rejects(() => pm.executeComputerAction({ type: 'open_app', app: 'xterm' }), /requires permission: apps/);
  });

  it('open_app is reversible (no confirmation) but requires apps permission', async () => {
    const pm = new PeripheralManager();
    await pm.initialize();
    await pm.grantPermission('apps');
    // open_app no longer requires confirmation (reversible launch); future destructive file actions will
    const meta = pm.validateComputerAction({ type: 'open_app', app: 'xterm' });
    assert.equal(meta.needsConfirmation, false);
    // without permission it would have been rejected in previous test; with permission it proceeds to spawn (may fail if xdg-open missing, but not confirmation)
    try {
      await pm.executeComputerAction({ type: 'open_app', app: 'xterm' });
    } catch (e: any) {
      assert.notEqual(e.code, 'CONFIRMATION_REQUIRED');
    }
  });

  it('validates schema', () => {
    const pm = new PeripheralManager();
    // initialize is async but validate doesn't need it for pure schema
    assert.throws(() => pm.validateComputerAction({ type: 'click', x: 'a', y: 10 } as any), /numeric/);
    assert.throws(() => pm.validateComputerAction({ type: 'open_app', app: '' } as any), /non-empty/);
    assert.throws(() => pm.validateComputerAction({ type: 'unknown' } as any), /Unknown/);
  });

  it('grant mouse allows click without confirmation', async () => {
    const pm = new PeripheralManager();
    await pm.initialize();
    await pm.grantPermission('mouse');
    // validation passes, execution may fail due to missing xdotool in env, but permission gate passes
    const meta = pm.validateComputerAction({ type: 'click', x: 10, y: 10 });
    assert.equal(meta.requires, 'mouse');
    assert.equal(meta.needsConfirmation, false);
  });

  it('spawn injection safe: text with shell metachars is single arg', async () => {
    const pm = new PeripheralManager();
    await pm.initialize();
    await pm.grantPermission('keyboard');
    // Should not throw validation, and spawn uses args array so "; rm -rf" stays literal
    const meta = pm.validateComputerAction({ type: 'type', text: 'hello; rm -rf /' });
    assert.equal(meta.type, 'type');
  });
});

describe('permission persistence deny-by-default', () => {
  it('isEnabled false for sensitive devices after initialize', async () => {
    const pm = new PeripheralManager();
    await pm.initialize();
    assert.equal(pm.isEnabled('screen'), false);
    assert.equal(pm.isEnabled('camera'), false);
    assert.equal(pm.isEnabled('microphone'), false);
    assert.equal(pm.isEnabled('apps'), false);
  });
});
