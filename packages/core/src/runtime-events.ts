// Smart Pet Agent — Runtime event contract

export type RuntimeEventName =
  | 'agent.ready'
  | 'agent.status'
  | 'chat.chunk'
  | 'chat.done'
  | 'chat.error'
  | 'chat.history'
  | 'task.started'
  | 'task.completed'
  | 'task.failed'
  | 'task.list'
  | 'permission.updated'
  | 'pet.intent'
  | 'voice.state'
  | 'audit.list'
  | 'provider.list';

export interface RuntimeEvent<T = Record<string, unknown>> {
  version: 1;
  event: RuntimeEventName;
  timestamp: number;
  payload: T;
}

export interface AgentStatusPayload {
  state: 'starting' | 'ready' | 'busy' | 'error';
  summary: string;
}

export interface ChatChunkPayload {
  text: string;
  mood?: string;
  animation?: string;
  provider?: string;
}

export interface PermissionRecord {
  device: string;
  enabled: boolean;
  scope?: string[];
  mode: 'ask' | 'allow' | 'deny';
  updatedAt: number;
  lastAccessed?: number;
}

export interface AuditLogRecord {
  id: number;
  event: string;
  device: string | null;
  action: string | null;
  detail: string | null;
  timestamp: number;
}

export interface ProviderConfigRecord {
  key: string;
  data: any;
  updatedAt: number;
}

export interface TaskRecord {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: string;
  output: string | null;
  created_at: number;
  updated_at: number;
}

export function createRuntimeEvent<T>(
  event: RuntimeEventName,
  payload: T,
): RuntimeEvent<T> {
  return {
    version: 1,
    event,
    timestamp: Date.now(),
    payload,
  };
}
