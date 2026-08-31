// Smart-Pet-Agent — Multi-Provider AI Manager
// packages/core/src/ai-manager.ts

export interface AIProvider {
  name: string;
  type: 'ollama' | 'lmstudio' | 'litellm' | 'openai' | 'anthropic' | 'google' | 'custom';
  baseURL: string;
  apiKey?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  capabilities: ('chat' | 'vision' | 'tools' | 'streaming')[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

export interface ChatOptions {
  system?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: any[];
}

export interface ChatResponse {
  content: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  model: string;
  provider: string;
}

export class AIManager {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string = 'ollama';
  private fallbackChain: string[] = [];

  constructor(providers: Record<string, AIProvider>) {
    for (const [key, provider] of Object.entries(providers)) {
      this.providers.set(key, provider);
    }
    // Set default to first provider
    const keys = Object.keys(providers);
    if (keys.length > 0) {
      this.defaultProvider = keys[0];
      this.fallbackChain = keys;
    }
  }

  async initialize(): Promise<void> {
    // Test each provider and remove unreachable ones
    for (const [name, provider] of this.providers) {
      try {
        await this.ping(provider);
        console.log(`[AI] Provider "${name}" ready (${provider.type}: ${provider.model})`);
      } catch (err) {
        console.warn(`[AI] Provider "${name}" unreachable, will skip`);
      }
    }
  }

  private async ping(provider: AIProvider): Promise<void> {
    const url = provider.type === 'ollama'
      ? `${provider.baseURL}/api/tags`
      : `${provider.baseURL}/health`;
    
    const response = await fetch(url, {
      headers: provider.apiKey ? { 'Authorization': `Bearer ${provider.apiKey}` } : {},
    });
    if (!response.ok) throw new Error(`Ping failed: ${response.status}`);
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    // Try providers in fallback chain
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

    throw new Error('All AI providers failed');
  }

  private async chatWithProvider(provider: AIProvider, options: ChatOptions): Promise<ChatResponse> {
    switch (provider.type) {
      case 'ollama':
        return this.chatOllama(provider, options);
      case 'lmstudio':
        return this.chatLMStudio(provider, options);
      case 'litellm':
      case 'openai':
      case 'anthropic':
      case 'google':
      case 'custom':
        return this.chatOpenAICompatible(provider, options);
      default:
        throw new Error(`Unknown provider type: ${provider.type}`);
    }
  }

  private async chatOllama(provider: AIProvider, options: ChatOptions): Promise<ChatResponse> {
    const messages = options.messages.map(m => ({
      role: m.role,
      content: m.content,
      images: m.images,
    }));

    if (options.system) {
      messages.unshift({ role: 'system', content: options.system });
    }

    const response = await fetch(`${provider.baseURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: provider.model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? provider.temperature ?? 0.7,
          num_predict: options.maxTokens ?? provider.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    const data = await response.json();

    return {
      content: data.message?.content || '',
      model: provider.model,
      provider: provider.name,
      usage: data.prompt_eval_count ? {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens: data.prompt_eval_count + data.eval_count,
      } : undefined,
    };
  }

  private async chatLMStudio(provider: AIProvider, options: ChatOptions): Promise<ChatResponse> {
    // LM Studio uses OpenAI-compatible API
    return this.chatOpenAICompatible({ ...provider, type: 'openai' }, options);
  }

  private async chatOpenAICompatible(provider: AIProvider, options: ChatOptions): Promise<ChatResponse> {
    const messages = [...options.messages];
    if (options.system) {
      messages.unshift({ role: 'system', content: options.system });
    }

    const response = await fetch(`${provider.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider.apiKey ? { 'Authorization': `Bearer ${provider.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: options.temperature ?? provider.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? provider.maxTokens ?? 2048,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI-compatible error: ${response.status}`);
    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: provider.model,
      provider: provider.name,
      usage: data.usage,
    };
  }

  // Per-task provider selection
  selectProviderForTask(task: string, requiresVision: boolean = false): string {
    // Agent decides which provider to use based on task
    for (const name of this.fallbackChain) {
      const provider = this.providers.get(name);
      if (!provider) continue;
      
      if (requiresVision && !provider.capabilities.includes('vision')) continue;
      if (task.includes('code') && provider.capabilities.includes('tools')) return name;
      if (task.includes('simple') && provider.type === 'ollama') return name; // Prefer local for simple
    }
    return this.defaultProvider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getDefaultProvider(): string {
    return this.defaultProvider;
  }
}
