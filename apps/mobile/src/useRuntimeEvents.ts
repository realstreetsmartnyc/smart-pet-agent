// Smart-Pet-Agent Mobile — React Native RuntimeEvent bridge
// apps/mobile/src/useRuntimeEvents.ts
// Mirrors Electron's onAIChunk/onAIDone/onGatewayStatus pattern using React state.

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RuntimeEvent, RuntimeEventName, PermissionRecord } from '../../../packages/core/src/runtime-events';

export interface RuntimeState {
  status: { state: string; summary: string };
  chunks: Array<{ text: string; provider?: string; mood?: string; animation?: string }>;
  done: boolean;
  error: string | null;
  petIntent: { animation?: string; mood?: string } | null;
  voiceState: string | null;
  permissions: PermissionRecord[];
  auditLogs: Array<{ id: number; event: string; device: string | null; action: string | null; detail: string | null; timestamp: number }>;
  tasks: Array<{ id: string; type: string; status: string; input: string; output: string | null; created_at: number; updated_at: number }>;
  providers: Array<{ key: string; data: any; updatedAt: number }>;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
}

const initialState: RuntimeState = {
  status: { state: 'starting', summary: 'Runtime is starting' },
  chunks: [],
  done: false,
  error: null,
  petIntent: null,
  voiceState: null,
  permissions: [],
  auditLogs: [],
  tasks: [],
  providers: [],
  chatHistory: [],
};

export function useRuntimeEvents() {
  const [state, setState] = useState<RuntimeState>(initialState);
  const listenersRef = useRef<Map<string, Function[]>>(new Map());

  const on = useCallback((event: RuntimeEventName, fn: (payload: any) => void) => {
    const arr = listenersRef.current.get(event) || [];
    arr.push(fn);
    listenersRef.current.set(event, arr);
    return () => {
      const current = listenersRef.current.get(event) || [];
      const next = current.filter((f) => f !== fn);
      listenersRef.current.set(event, next);
    };
  }, []);

  const emit = useCallback((event: RuntimeEvent) => {
    const fns = listenersRef.current.get(event.event) || [];
    fns.forEach((fn) => {
      try { fn(event.payload); } catch {}
    });

    setState((prev) => {
      const next = { ...prev };
      const payload = event.payload as any;
      switch (event.event) {
        case 'agent.status':
          next.status = { state: payload.state || prev.status.state, summary: payload.summary || prev.status.summary };
          break;
        case 'chat.chunk':
          next.chunks = [...prev.chunks, { text: payload.text, provider: payload.provider, mood: payload.mood, animation: payload.animation }];
          next.done = false;
          next.error = null;
          break;
        case 'chat.done':
          next.done = true;
          break;
        case 'chat.error':
          next.error = payload.message || 'Unknown error';
          next.done = true;
          break;
        case 'pet.intent':
          next.petIntent = { animation: payload.animation, mood: payload.mood };
          break;
        case 'voice.state':
          next.voiceState = payload.state || null;
          break;
        case 'permission.updated':
          if (payload.permissions) next.permissions = payload.permissions;
          if (payload.permission) {
            next.permissions = next.permissions.map((p) => p.device === payload.permission.device ? payload.permission : p);
          }
          break;
        case 'audit.list':
          next.auditLogs = payload.logs || [];
          break;
        case 'task.list':
          next.tasks = payload.tasks || [];
          break;
        case 'provider.list':
          next.providers = payload.providers || [];
          break;
        case 'chat.history':
          next.chatHistory = payload.history || [];
          break;
        default:
          break;
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    listenersRef.current.clear();
  }, []);

  return { state, on, emit, reset };
}
