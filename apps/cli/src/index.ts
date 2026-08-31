#!/usr/bin/env tsx
// Smart-Pet-Agent CLI Entry Point
// apps/cli/src/index.ts

import { AgentLoop, UserInput, AgentResponse } from '@smart-pet/core/agent-loop';
import { AIManager, AIProvider } from '@smart-pet/core/ai-manager';
import * as readline from 'readline';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const DATA_DIR = path.join(os.homedir(), '.smart-pet-agent');
const MEMORY_DB = path.join(DATA_DIR, 'memory.db');

// Default AI providers (user overrides via config)
const defaultProviders: Record<string, AIProvider> = {
  ollama: {
    name: 'ollama',
    type: 'ollama',
    baseURL: 'http://localhost:11434',
    model: 'llama3.2:latest',
    capabilities: ['chat', 'streaming'],
  },
  litellm: {
    name: 'litellm',
    type: 'litellm',
    baseURL: 'http://localhost:4000',
    model: 'gpt-4o-mini',
    capabilities: ['chat', 'tools', 'streaming'],
  },
};

// Load user config if exists
function loadConfig(): Record<string, AIProvider> {
  const configPath = path.join(DATA_DIR, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      return defaultProviders;
    }
  }
  return defaultProviders;
}

async function main() {
  const args = process.argv.slice(2);
  const providers = loadConfig();

  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🐾 Smart-Pet-Agent v0.1.0             ║
  ║   Your ever-evolving AI companion       ║
  ╚══════════════════════════════════════════╝
  `);

  // Ensure data dir exists
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Initialize agent
  const agent = new AgentLoop({
    aiProviders: providers,
    memoryPath: MEMORY_DB,
  });

  try {
    await agent.initialize();
    console.log('✓ Agent ready');
  } catch (err) {
    console.error('Failed to initialize:', err);
    process.exit(1);
  }

  // One-shot mode
  if (args.length > 0 && args[0] !== '--interactive' && args[0] !== '-i') {
    const input = args.join(' ');
    const response = await agent.processInput({
      type: 'text',
      content: input,
    });
    console.log(`\n🤖 Smart: ${response.text}`);
    if (response.learned) console.log(`   💡 Learned: ${response.learned}`);
    process.exit(0);
  }

  // Interactive mode
  console.log('Interactive mode. Type "exit" to quit, "help" for commands.\n');
  console.log(`Mood: ${agent.getState().mood} | Energy: ${agent.getState().energy}%`);
  console.log(`Providers: ${Object.keys(providers).join(', ')}`);
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You > ',
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input === 'exit' || input === 'quit') {
      console.log('Goodbye! 👋');
      process.exit(0);
    }

    if (input === 'help') {
      console.log(`
Commands:
  exit/quit    — Exit
  help         — This help
  state        — Show agent state
  memory       — Show recent memories
  permissions  — Show peripheral permissions
  grant <dev>  — Grant device permission (camera, screen, etc.)
  revoke <dev> — Revoke device permission
  delegate <agent> <task> — Delegate to Hermes/Codex/Gemini/etc.
      `);
      rl.prompt();
      return;
    }

    if (input === 'state') {
      const state = agent.getState();
      console.log(JSON.stringify(state, null, 2));
      rl.prompt();
      return;
    }

    if (input.startsWith('delegate ')) {
      const parts = input.slice(9).split(' ');
      const agentName = parts[0];
      const task = parts.slice(1).join(' ');
      console.log(`Delegating to ${agentName}...`);
      // This would use the delegation manager
      rl.prompt();
      return;
    }

    // Process through agent
    try {
      process.stdout.write('🤖 Smart: ');
      const response = await agent.processInput({
        type: 'text',
        content: input,
      });
      console.log(response.text);
      console.log(`   [Mood: ${response.mood} | Animation: ${response.animation}]`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
    }

    rl.prompt();
  });
}

main().catch(console.error);
