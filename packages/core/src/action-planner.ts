// Smart-Pet-Agent — Action Planner
// packages/core/src/action-planner.ts

import { AgentAction, AgentState } from './agent-loop.js';

export class ActionPlanner {
  parse(reasoning: string, state: AgentState, context: any): AgentAction[] {
    const actions: AgentAction[] = [];

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(reasoning);
      if (parsed.actions && Array.isArray(parsed.actions)) {
        for (const action of parsed.actions) {
          actions.push({
            type: action.type,
            payload: action.payload,
            reasoning: action.reasoning || 'Agent chose this action',
            confidence: action.confidence ?? 0.8,
          });
        }
        return actions;
      }
    } catch {
      // Not JSON — parse natural language reasoning
    }

    // Fallback: infer actions from reasoning text
    const text = reasoning.toLowerCase();

    // Always speak if there's content
    actions.push({
      type: 'speak',
      payload: { text: reasoning, animation: this.inferAnimation(text, state) },
      reasoning: 'Primary response to user input',
      confidence: 1.0,
    });

    // Infer additional actions
    if (text.includes('delegate') || text.includes('send to')) {
      const agent = this.extractAgentName(text);
      actions.push({
        type: 'delegate',
        payload: { agent, task: reasoning, context },
        reasoning: `Task exceeds current capabilities, delegating to ${agent}`,
        confidence: 0.7,
      });
    }

    if (text.includes('open') || text.includes('app') || text.includes('file')) {
      actions.push({
        type: 'computer_use',
        payload: { description: 'Open application', command: this.extractCommand(text) },
        reasoning: 'User requested application/file operation',
        confidence: 0.6,
      });
    }

    if (text.includes('camera') || text.includes('see') || text.includes('look')) {
      actions.push({
        type: 'peripheral',
        payload: { device: 'camera', action: 'capture' },
        reasoning: 'Visual input required for response',
        confidence: 0.5,
      });
    }

    if (text.includes('learn') || text.includes('remember') || text.includes('note')) {
      actions.push({
        type: 'learn',
        payload: { insight: { trait: 'memory', delta: 0.05 } },
        reasoning: 'Storing interaction for future reference',
        confidence: 0.9,
      });
    }

    return actions;
  }

  private inferAnimation(text: string, state: AgentState): string {
    if (text.includes('happy') || text.includes('great') || text.includes('wonderful')) return 'smile';
    if (text.includes('sad') || text.includes('sorry') || text.includes('unfortunate')) return 'sad';
    if (text.includes('angry') || text.includes('frustrated')) return 'angry';
    if (text.includes('think') || text.includes('hmm') || text.includes('consider')) return 'think';
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) return 'wave';
    if (text.includes('bye') || text.includes('goodbye')) return 'wave';
    if (text.includes('celebrate') || text.includes('dance')) return 'dance';
    if (state.energy < 20) return 'sleep';
    return 'talk';
  }

  private extractAgentName(text: string): string {
    const agents = ['hermes', 'codex', 'gemini', 'opencode', 'vibe', 'claude', 'aider'];
    for (const agent of agents) {
      if (text.includes(agent)) return agent;
    }
    return 'hermes'; // default delegation target
  }

  private extractCommand(text: string): string {
    const match = text.match(/(?:open|run|start|launch)\s+(\w+)/);
    return match ? match[1] : '';
  }
}
