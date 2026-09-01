import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [path.join(repoRoot, 'packages/core/src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: path.join(repoRoot, 'apps/electron/src/agent-runtime.mjs'),
  external: ['better-sqlite3'],
  sourcemap: false,
  logLevel: 'info',
});
