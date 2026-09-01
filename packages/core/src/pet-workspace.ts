// Staged pet workspace — isolated from installed pets
// ~/.smart-pet-agent/pet-workspaces/<jobId>/{input,draft,generated,preview,validation.json,export/}
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export function getWorkspaceRoot() { return process.env.SMART_PET_TEST === '1' ? path.join(os.tmpdir(), 'smart-pet-agent-pet-workspaces') : path.join(os.homedir(), '.smart-pet-agent', 'pet-workspaces'); }
export function getPetsRoot() { return process.env.SMART_PET_TEST === '1' ? path.join(os.tmpdir(), 'smart-pet-agent-pets') : path.join(os.homedir(), '.smart-pet-agent', 'pets'); }
export const WORKSPACE_ROOT = getWorkspaceRoot();
export const PETS_ROOT = getPetsRoot();
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_WORKSPACE_BYTES = 100 * 1024 * 1024;
export const ALLOWED_MIME = new Set(['image/png','image/jpeg','image/webp','image/jpg']);

export function ensureWorkspace(jobId: string) {
  const dir = path.join(getWorkspaceRoot(), jobId);
  fs.mkdirSync(path.join(dir,'input'), {recursive:true});
  fs.mkdirSync(path.join(dir,'draft'), {recursive:true});
  fs.mkdirSync(path.join(dir,'generated'), {recursive:true});
  fs.mkdirSync(path.join(dir,'preview'), {recursive:true});
  fs.mkdirSync(path.join(dir,'export'), {recursive:true});
  return dir;
}
export function workspacePath(jobId: string, ...parts: string[]) {
  return path.join(getWorkspaceRoot(), jobId, ...parts);
}
export function assertNoTraversal(p: string) {
  if (p.includes('..') || p.includes('/.') || p.startsWith('/')) throw new Error('path traversal');
}
