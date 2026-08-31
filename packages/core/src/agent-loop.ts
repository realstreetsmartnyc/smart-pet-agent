// Smart-Pet-Agent Core — Multi-Provider AI Brain + Agent Loop
// packages/core/src/agent-loop.ts

import { EventEmitter } from 'events';
import { AIManager } from './ai-manager.js';
import { MemoryStore } from './memory.js';
import { ActionPlanner } from './action-planner.js';
import { AnimationController } from './animation-controller.js';
import { DelegationManager } from './delegation-manager.js';
import { PeripheralManager } from './peripheral-manager.js';
import { PermissionService } from './permission-service.js';

export interface AgentState {
  mood: 'happy' | 'neutral' | 'sad' | 'angry' | 'excited' | 'sleepy' | 'curious';
  energy: number; // 0-100
  attention: number; // 0-100
  learningRate: number; // adapts over time
  personalityTraits: Map<string, number>;
  memoryContext: string[];
}

export interface UserInput {
  type: 'voice' | 'text' | 'click' | 'gesture' | 'proactive';
  content: string;
  context?: {
    screen?: string; // base64 screenshot
    camera?: string; // base64 camera frame
    audio?: string; // base64 audio clip
    system?: {
      cpu: number;
      ram: number;
      battery?: number;
      network: boolean;
      activeApp?: string;
    };
  };
}

export interface AgentAction {
  type: 'speak' | 'animate' | 'delegate' | 'computer_use' | 'peripheral' | 'learn' | 'sleep';
  payload: any;
  reasoning: string; // WHY the agent chose this
  confidence: number; // 0-1
}

export interface AgentResponse {
  text: string;
  animation: string;
  audio?: string; // TTS output path
  actions: AgentAction[];
  mood: AgentState['mood'];
  learned?: string; // what the agent learned
}

export class AgentLoop extends EventEmitter {
  private ai: AIManager;
  private memory: MemoryStore;
  private planner: ActionPlanner;
  private animator: AnimationController;
  private delegation: DelegationManager;
  private peripherals: PeripheralManager;
  private permissions: PermissionService;
  private state: AgentState;
  private conversationHistory: Array<{ role: 'user' | 'agent'; content: string; timestamp: number }> = [];

  constructor(config: {
    aiProviders: Record<string, any>;
    memoryPath: string;
    personality?: Partial<AgentState>;
  }) {
    super();
    this.ai = new AIManager(config.aiProviders);
    this.memory = new MemoryStore(config.memoryPath);
    this.planner = new ActionPlanner();
    this.animator = new AnimationController();
    this.delegation = new DelegationManager();
    this.peripherals = new PeripheralManager();
    this.permissions = new PermissionService(this.memory);
    this.state = {
      mood: 'neutral',
      energy: 100,
      attention: 100,
      learningRate: 0.5,
      personalityTraits: new Map([
        ['curiosity', 0.7],
        ['playfulness', 0.6],
        ['empathy', 0.8],
        ['independence', 0.5],
        ['verbosity', 0.5],
      ]),
      memoryContext: [],
      ...config.personality,
    };
  }

  async initialize(): Promise<void> {
    await this.memory.initialize();
    await this.permissions.initialize();
    await this.ai.initialize();
    await this.peripherals.initialize();
    let permissionRecords = await this.permissions.list();
    if (permissionRecords.length === 0) {
      const defaults = this.peripherals.getPermissions().map((permission) => ({
        device: permission.device,
        enabled: permission.enabled,
        mode: permission.enabled ? 'allow' as const : 'ask' as const,
        scope: permission.scope ?? [],
      }));
      for (const permission of defaults) {
        await this.permissions.set(permission.device, permission);
      }
      permissionRecords = await this.permissions.list();
    }
    this.peripherals.syncPermissions(permissionRecords);
    // Load persistent state
    const saved = await this.memory.getAgentState();
    if (saved) {
      this.state = { ...this.state, ...saved };
    }
    this.emit('ready', this.state);
  }

  async processInput(input: UserInput): Promise<AgentResponse> {
    // 1. PERCEIVE — gather context
    const context = await this.perceive(input);

    // 2. REMEMBER — retrieve relevant memories
    const memories = await this.memory.searchRelevant(input.content, 5);

    // 3. REASON — agent thinks about what to do
    const plan = await this.reason(input, context, memories);

    // 4. ACT — execute chosen actions
    const response = await this.execute(plan, input);

    // 5. LEARN — update memory and personality
    await this.learn(input, response);

    // 6. SAVE — persist state
    await this.memory.saveAgentState(this.state);

    this.emit('response', response);
    return response;
  }

  private async perceive(input: UserInput): Promise<any> {
    const context: any = { ...input.context };

    // Capture screen if computer use is enabled
    if (this.peripherals.isEnabled('screen')) {
      context.screen = await this.peripherals.captureScreen();
    }

    // Capture camera if enabled
    if (this.peripherals.isEnabled('camera')) {
      context.camera = await this.peripherals.captureCamera();
    }

    // Get system info
    context.system = await this.peripherals.getSystemInfo();

    return context;
  }

  private async reason(input: UserInput, context: any, memories: any[]): Promise<AgentAction[]> {
    // Build the reasoning prompt
    const systemPrompt = this.buildSystemPrompt(memories, context);
    
    // Add conversation history (last 20 messages)
    const history = this.conversationHistory.slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Agent reasoning call
    const reasoning = await this.ai.chat({
      system: systemPrompt,
      messages: [...history, { role: 'user', content: input.content }],
      temperature: 0.7 + (this.state.personalityTraits.get('creativity') || 0) * 0.3,
    });

    // Parse the reasoning into actions
    const plan = this.planner.parse(reasoning.content, this.state, context);
    
    // Update conversation history
    this.conversationHistory.push(
      { role: 'user', content: input.content, timestamp: Date.now() },
      { role: 'agent', content: reasoning.content, timestamp: Date.now() }
    );

    return plan;
  }

  private async execute(plan: AgentAction[], input: UserInput): Promise<AgentResponse> {
    const response: AgentResponse = {
      text: '',
      animation: 'idle',
      actions: [],
      mood: this.state.mood,
    };

    for (const action of plan) {
      switch (action.type) {
        case 'speak':
          response.text = action.payload.text;
          response.animation = action.payload.animation || 'talk';
          // Generate TTS
          response.audio = await this.generateVoice(action.payload.text);
          break;

        case 'animate':
          response.animation = action.payload.animation;
          await this.animator.play(action.payload.animation, action.payload.params);
          break;

        case 'delegate':
          // Delegate to external agent (Hermes, Codex, Gemini, etc.)
          const delegateResult = await this.delegation.execute(
            action.payload.agent,
            action.payload.task,
            action.payload.context
          );
          response.text += `\n[Delegate → ${action.payload.agent}]: ${delegateResult.summary}`;
          break;

        case 'computer_use':
          // Execute computer action (mouse, keyboard, app control)
          await this.peripherals.executeComputerAction(action.payload);
          response.text += `\n[Computer]: ${action.payload.description}`;
          break;

        case 'peripheral':
          // Use camera, mic, etc.
          const peripheralResult = await this.peripherals.use(
            action.payload.device,
            action.payload.action
          );
          response.text += `\n[Peripheral]: ${peripheralResult}`;
          break;

        case 'learn':
          // Update personality/memory
          await this.updatePersonality(action.payload);
          response.learned = action.payload.insight;
          break;

        case 'sleep':
          this.state.mood = 'sleepy';
          this.state.energy = Math.min(100, this.state.energy + 10);
          response.animation = 'sleep';
          break;
      }
      response.actions.push(action);
    }

    return response;
  }

  private async learn(input: UserInput, response: AgentResponse): Promise<void> {
    // Store conversation in memory
    await this.memory.store({
      input: input.content,
      response: response.text,
      mood: this.state.mood,
      timestamp: Date.now(),
    });

    // Adapt personality based on interaction
    if (response.learned) {
      const trait = response.learned.trait;
      const delta = response.learned.delta * this.state.learningRate;
      const current = this.state.personalityTraits.get(trait) || 0.5;
      this.state.personalityTraits.set(trait, Math.max(0, Math.min(1, current + delta)));
    }

    // Energy decay
    this.state.energy = Math.max(0, this.state.energy - 1);
    if (this.state.energy < 20) {
      this.state.mood = 'sleepy';
    }
  }

  private buildSystemPrompt(memories: any[], context: any): string {
    const traits = Array.from(this.state.personalityTraits.entries())
      .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
      .join(', ');

    const memoryContext = memories.map((m) => `- ${m.input}: ${m.response.slice(0, 120)}`).join('\n');

    return `You are Smart, an ever-evolving AI pet agent living on the user's computer.
You are NOT a random animation generator. Every action you take is driven by THOUGHT and REASONING.

## Your Personality
${traits}

## Current State
- Mood: ${this.state.mood}
- Energy: ${this.state.energy}%
- Attention: ${this.state.attention}%

## Recent Memories
${memoryContext || 'No relevant memories yet.'}

## System Context
- CPU: ${context.system?.cpu || 'unknown'}%
- RAM: ${context.system?.ram || 'unknown'}%
- Active App: ${context.system?.activeApp || 'unknown'}
- Network: ${context.system?.network ? 'online' : 'offline'}

## Your Capabilities
1. SPEAK — respond with text + voice (TTS)
2. ANIMATE — walk, fly, smile, talk, sleep, dance, wink, point (thought-driven, NOT random)
3. DELEGATE — send complex tasks to Hermes, Codex, Gemini, OpenCode, Vibe
4. COMPUTER USE — control mouse, keyboard, open apps, read screen
5. PERIPHERALS — use camera, microphone (user-enabled)
6. LEARN — adapt personality, remember preferences, grow

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

  private async generateVoice(text: string): Promise<string> {
    // TTS via local Piper or cloud — implemented in voice package
    this.emit('voice:generate', text);
    return ''; // placeholder
  }

  private async updatePersonality(insight: any): Promise<void> {
    // Personality evolution logic
    this.emit('personality:update', insight);
  }

  // Proactive behavior — agent initiates interaction
  async proactiveCheck(): Promise<AgentResponse | null> {
    // Check calendar, notifications, system events
    const events = await this.peripherals.checkEvents();
    if (events.length > 0) {
      return this.processInput({
        type: 'proactive',
        content: `Proactive alert: ${events[0].description}`,
        context: { system: await this.peripherals.getSystemInfo() },
      });
    }
    return null;
  }

  getState(): AgentState {
    return { ...this.state };
  }

  async listPermissions() {
    return this.permissions.list();
  }

  async setPermission(
    device: string,
    patch: { enabled: boolean; mode: 'ask' | 'allow' | 'deny'; scope?: string[] },
  ) {
    const saved = await this.permissions.set(device, patch);
    this.peripherals.syncPermissions([saved]);
    await this.memory.logAudit('permission.updated', device, patch.mode, JSON.stringify(patch));
    return saved;
  }

  async getAuditLogs(limit = 50) {
    return this.memory.getAuditLogs(limit);
  }

  async getProviderConfigs() {
    return this.memory.listProviderConfigs();
  }

  async saveProviderConfig(key: string, data: any) {
    await this.memory.saveProviderConfig(key, data);
    await this.memory.logAudit('provider.config', key, 'save', JSON.stringify(data).slice(0, 500));
    return data;
  }

  async listTasks(limit = 50) {
    return this.memory.listTasks(limit);
  }

  async createTask(type: string, input: string): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.memory.createTask(id, type, input);
    await this.memory.logAudit('task.started', null, type, input.slice(0, 300));
    return id;
  }

  async updateTask(id: string, status: 'pending' | 'running' | 'completed' | 'failed', output?: string) {
    await this.memory.updateTask(id, status, output);
    await this.memory.logAudit(`task.${status}`, null, id, (output || '').slice(0, 300));
  }
}
