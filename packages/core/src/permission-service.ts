// Smart Pet Agent — Persistent permission service

import type { PermissionRecord } from './runtime-events.js';
import { MemoryStore } from './memory.js';

export class PermissionService {
  constructor(private memory: MemoryStore) {}

  async initialize(): Promise<void> {
    await this.memory.initializePermissions();
  }

  async list(): Promise<PermissionRecord[]> {
    return this.memory.listPermissions();
  }

  async get(device: string): Promise<PermissionRecord | null> {
    return this.memory.getPermission(device);
  }

  async set(
    device: string,
    patch: Partial<PermissionRecord> & Pick<PermissionRecord, 'enabled' | 'mode'>,
  ): Promise<PermissionRecord> {
    const next: PermissionRecord = {
      device,
      enabled: patch.enabled,
      mode: patch.mode,
      scope: patch.scope ?? [],
      updatedAt: Date.now(),
      lastAccessed: patch.lastAccessed,
    };
    await this.memory.savePermission(next);
    return next;
  }

  async touch(device: string): Promise<void> {
    const current = await this.get(device);
    if (!current) return;
    await this.memory.savePermission({
      ...current,
      lastAccessed: Date.now(),
      updatedAt: Date.now(),
    });
  }
}
