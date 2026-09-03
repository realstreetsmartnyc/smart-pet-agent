#!/usr/bin/env node
// Smart-Pet-Agent CLI Entry Point with Android Build Support
// apps/cli/src/index.ts - cross-platform (Linux/Mac/Win)

import { AgentLoop, UserInput, AgentResponse } from '@smart-pet/core/agent-loop';
import { AIManager, AIProvider } from '@smart-pet/core/ai-manager';
import * as readline from 'readline';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { execSync, spawnSync } from 'child_process';

function getDataDir(): string {
  if (process.env.SMART_PET_TEST === '1') return path.join(os.tmpdir(), 'smart-pet-agent-cli');
  const p = path.join(os.homedir(), '.smart-pet-agent');
  try { fs.mkdirSync(p, { recursive: true }); return p; } catch { const f = path.join(os.tmpdir(), 'smart-pet-agent-cli'); fs.mkdirSync(f, { recursive: true }); return f; }
}
function getMemoryPath(): string {
  if (process.env.SMART_PET_TEST === '1') return ':memory:';
  return path.join(getDataDir(), 'memory.db');
}
const DATA_DIR = getDataDir();
const MEMORY_DB = getMemoryPath();

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

export type AndroidBuildTarget = 'apk' | 'aab' | 'bundle';

export interface AndroidBuildResult {
  success: boolean;
  path?: string;
  message: string;
  method: 'gradle' | 'eas' | 'none';
}

/**
 * Android build provider - shells out to Gradle for local builds
 * Compatible with the existing provider system (ollama, litellm, etc.)
 */
export const androidBuildProvider = {
  id: 'android-build',
  capabilities: { apk: true, aab: true, bundle: true, formats: ['apk', 'aab', 'bundle'] },

  async build(target: AndroidBuildTarget = 'apk', method?: 'gradle' | 'eas'): Promise<AndroidBuildResult> {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const mobilePath = path.join(repoRoot, 'apps', 'mobile');

    if (!fs.existsSync(mobilePath)) {
      return { success: false, message: 'Mobile project not found at apps/mobile', method: 'none' };
    }

    // Auto-detect method if not specified
    let buildMethod = method;
    if (!buildMethod) {
      const hasEAS = !!process.env.EAS_TOKEN;
      const hasAndroidSDK = !!process.env.ANDROID_HOME || !!process.env.ANDROID_SDK_ROOT;
      buildMethod = hasEAS ? 'eas' : (hasAndroidSDK ? 'gradle' : 'gradle');
    }

    if (buildMethod === 'eas') {
      return this._buildEAS(mobilePath, target);
    } else {
      return this._buildGradle(mobilePath, target);
    }
  },

  async _buildGradle(mobilePath: string, target: AndroidBuildTarget): Promise<AndroidBuildResult> {
    console.log(`\n=== Android Gradle Build: ${target} ===`);

    const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    if (!androidHome) {
      return {
        success: false,
        message: 'ANDROID_HOME or ANDROID_SDK_ROOT must be set for local Gradle builds',
        method: 'gradle'
      };
    }

    try {
      // Run prebuild if android folder doesn't exist
      const androidDir = path.join(mobilePath, 'android');
      if (!fs.existsSync(androidDir)) {
        console.log('Running expo prebuild...');
        const prebuild = spawnSync('npx', ['expo', 'prebuild', '--platform', 'android', '--clean'], {
          cwd: mobilePath,
          stdio: 'inherit',
          env: { ...process.env, CI: 'true' }
        });
        if (prebuild.status !== 0) {
          return { success: false, message: 'expo prebuild failed', method: 'gradle' };
        }
      }

      // Build with Gradle
      const gradleTask = target === 'apk' ? 'assembleDebug' : 'bundle' + target.toUpperCase();
      console.log(`Running: ./gradlew ${gradleTask}`);

      const gradle = spawnSync('./gradlew', [gradleTask], {
        cwd: androidDir,
        stdio: 'inherit',
        env: { ...process.env, ANDROID_HOME: androidHome }
      });

      if (gradle.status !== 0) {
        return { success: false, message: `Gradle ${gradleTask} failed`, method: 'gradle' };
      }

      // Locate output
      const outputPath = target === 'apk'
        ? path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
        : path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');

      return {
        success: true,
        path: outputPath,
        message: `Android ${target.toUpperCase()} built successfully via Gradle`,
        method: 'gradle'
      };
    } catch (error: any) {
      return { success: false, message: `Gradle build error: ${error.message}`, method: 'gradle' };
    }
  },

  async _buildEAS(mobilePath: string, target: AndroidBuildTarget): Promise<AndroidBuildResult> {
    console.log(`\n=== Android EAS Build: ${target} ===`);

    if (!process.env.EAS_TOKEN) {
      return {
        success: false,
        message: 'EAS_TOKEN environment variable is required for EAS builds',
        method: 'eas'
      };
    }

    try {
      const profile = target === 'apk' ? 'preview' : 'production';
      const eas = spawnSync('eas', ['build', '--platform', 'android', '--profile', profile, '--non-interactive'], {
        cwd: mobilePath,
        stdio: 'inherit',
        env: { ...process.env, EXPO_TOKEN: process.env.EAS_TOKEN }
      });

      if (eas.status !== 0) {
        return { success: false, message: 'EAS build failed', method: 'eas' };
      }

      return {
        success: true,
        message: `Android ${target.toUpperCase()} build submitted to EAS (check expo.dev for status)`,
        method: 'eas'
      };
    } catch (error: any) {
      return { success: false, message: `EAS build error: ${error.message}`, method: 'eas' };
    }
  }
};

/**
 * Parse --target choice from CLI args
 */
function parseTarget(args: string[]): { target?: AndroidBuildTarget, method?: 'gradle' | 'eas', isBuild: boolean } {
  const isBuild = args.includes('--build') || args.includes('-b');
  let target: AndroidBuildTarget | undefined;
  let method: 'gradle' | 'eas' | undefined;

  const targetArg = args.find(a => a.startsWith('--target='));
  if (targetArg) {
    const value = targetArg.split('=')[1];
    if (value === 'apk' || value === 'aab' || value === 'bundle' || value === 'android') {
      target = value === 'android' ? 'apk' : value;
    }
  }

  if (args.includes('--gradle') || args.includes('--local')) method = 'gradle';
  if (args.includes('--eas') || args.includes('--cloud')) method = 'eas';

  return { target, method, isBuild };
}

async function main() {
  const args = process.argv.slice(2);
  const providers = loadConfig();
  const { target, method, isBuild } = parseTarget(args);

  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🐾 Smart-Pet-Agent v1.0.0             ║
  ║   Your ever-evolving AI companion       ║
  ╚══════════════════════════════════════════╝
  `);

  // Ensure data dir exists
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Handle build command early (before agent init)
  if (isBuild) {
    const result = await androidBuildProvider.build(target || 'apk', method);
    if (result.success) {
      console.log(`\n✅ ${result.message}`);
      if (result.path) {
        console.log(`📦 Build at: ${result.path}`);
      }
    } else {
      console.log(`\n❌ ${result.message}`);
      process.exit(1);
    }
    if (!args.includes('--continue')) {
      process.exit(0);
    }
  }

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

  rl.on('SIGINT', () => {
    console.log('\nGoodbye! 👋');
    process.exit(0);
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
      console.log(`Commands:
  exit/quit      — Exit
  help           — This help
  state          — Show agent state
  memory         — Show recent memories
  permissions    — Show peripheral permissions
  grant <dev>    — Grant device permission (camera, screen, etc.)
  revoke <dev>   — Revoke device permission
  delegate <agent> <task> — Delegate to Hermes/Codex/Gemini/etc.
  build android [apk|aab|bundle] [--gradle|--eas] — Build Android app
  build linux    — Build Linux desktop
  build mac      — Build macOS
  build win      — Build Windows
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
      rl.prompt();
      return;
    }

    if (input.startsWith('build android')) {
      const parts = input.split(' ');
      const tgt = (parts[2] || 'apk') as AndroidBuildTarget;
      const m = input.includes('--gradle') ? 'gradle' : (input.includes('--eas') ? 'eas' : undefined);
      const result = await androidBuildProvider.build(tgt, m);
      console.log(result.message);
      if (result.path) console.log(`📦 Built at: ${result.path}`);
      rl.prompt();
      return;
    }

    if (input === 'build linux') {
      console.log('Building Linux desktop...');
      try {
        execSync('pnpm build:linux', { stdio: 'inherit' });
        console.log('✅ Linux build complete');
      } catch (e: any) {
        console.error('❌ Linux build failed:', e.message);
      }
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
