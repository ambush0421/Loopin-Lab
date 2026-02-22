import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const nextBinary = resolve(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
if (!existsSync(nextBinary)) {
  throw new Error(`[build] next binary not found: ${nextBinary}. Run npm install first.`);
}

const buildEnv = { ...process.env };

// Force webpack in environments where Turbopack/wasm path causes build failures
// (e.g. limited CLI/runtime environments on Windows + edge builds).
buildEnv.NEXT_DISABLE_TURBOPACK = '1';
if ('TURBOPACK' in buildEnv) {
  delete buildEnv.TURBOPACK;
}

const buildArgs = [nextBinary, 'build', '--webpack'];
const run = (args) =>
  spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: buildEnv,
    shell: false,
  });

let result = run(buildArgs);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
