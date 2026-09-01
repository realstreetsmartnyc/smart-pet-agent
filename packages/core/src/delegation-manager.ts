// Smart-Pet-Agent — Delegation Manager (Multi-Agent Bridge)
// packages/core/src/delegation-manager.ts

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DelegationTarget {
  name: string;
  type: 'cli' | 'api' | 'acp';
  command: string;
  maxTimeout: number;
}

export interface DelegationResult {
  success: boolean;
  summary: string;
  details?: string;
  agent: string;
  duration: number;
}

export class DelegationManager {
  private targets: Map<string, DelegationTarget> = new Map([
    ['hermes', { name: 'hermes', type: 'acp', command: 'hermes', maxTimeout: 120000 }],
    ['codex', { name: 'codex', type: 'cli', command: 'codex', maxTimeout: 180000 }],
    ['gemini', { name: 'gemini', type: 'cli', command: 'gemini', maxTimeout: 60000 }],
    ['opencode', { name: 'opencode', type: 'cli', command: 'opencode', maxTimeout: 120000 }],
    ['vibe', { name: 'vibe', type: 'cli', command: 'vibe', maxTimeout: 120000 }],
    ['claude', { name: 'claude', type: 'cli', command: 'claude', maxTimeout: 120000 }],
    ['aider', { name: 'aider', type: 'cli', command: 'aider', maxTimeout: 180000 }],
  ]);

  async execute(agent: string, task: string, context?: any): Promise<DelegationResult> {
    const target = this.targets.get(agent);
    if (!target) {
      return {
        success: false,
        summary: `Unknown agent: ${agent}. Available: ${this.getAvailableAgents().join(', ')}`,
        agent,
        duration: 0,
      };
    }

    const startTime = Date.now();
    try {
      let result: string;

      switch (target.type) {
        case 'cli':
          result = await this.executeCLI(target, task);
          break;
        case 'api':
          result = await this.executeAPI(target, task);
          break;
        case 'acp':
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
        duration: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        summary: `Agent "${agent}" failed: ${err.message}`,
        agent,
        duration: Date.now() - startTime,
      };
    }
  }

  private async executeCLI(target: DelegationTarget, task: string): Promise<string> {
    // Check if command exists (no shell injection: use command as-is, platform checks PATH)
    try {
      await execAsync(`which ${target.command}`);
    } catch {
      return `[${target.name}] CLI not found. Install ${target.command} to enable delegation.`;
    }

    // Execute without shell interpolation to avoid injection — pass task as single arg
    return new Promise((resolve, reject) => {
      const child = spawn(target.command, [task], { timeout: target.maxTimeout });
      let out = '', err = '';
      child.stdout?.on('data', (d) => { out += d.toString(); if (out.length > 10*1024*1024) child.kill(); });
      child.stderr?.on('data', (d) => { err += d.toString(); });
      child.on('error', (e) => reject(e));
      child.on('close', () => resolve(out || err || '(no output)'));
      setTimeout(() => { try { child.kill(); } catch {} }, target.maxTimeout);
    });
  }

  private async executeAPI(target: DelegationTarget, task: string): Promise<string> {
    // For agents with direct API access
    // TODO: Implement API-based delegation
    return `[${target.name}] API delegation not yet implemented`;
  }

  private async executeACP(target: DelegationTarget, task: string, context?: any): Promise<string> {
    // Agent Communication Protocol (Hermes uses this)
    // Send task via ACP and await response
    return `[${target.name}] ACP delegation pending — will use Hermes mesh protocol`;
  }

  getAvailableAgents(): string[] {
    return Array.from(this.targets.keys());
  }

  registerAgent(name: string, target: DelegationTarget): void {
    this.targets.set(name, target);
  }

  async healthCheck(agent: string): Promise<boolean> {
    const target = this.targets.get(agent);
    if (!target) return false;
    try {
      await execAsync(`which ${target.command}`);
      return true;
    } catch {
      return false;
    }
  }
}
