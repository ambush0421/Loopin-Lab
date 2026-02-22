import { rmSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const nodeBinDir = dirname(process.execPath);
const npxCommand = isWindows ? join(nodeBinDir, 'npx.cmd') : 'npx';
const npxCliScript = isWindows ? join(nodeBinDir, 'node_modules', 'npm', 'bin', 'npx-cli.js') : '';
const canRunNpxCli = isWindows && existsSync(npxCliScript);
const localBinDir = join(process.cwd(), 'node_modules', '.bin');
const vercelBin = join(process.cwd(), 'node_modules', 'vercel', 'dist', 'vc.js');
const nextOnPagesBin = join(process.cwd(), 'node_modules', '@cloudflare', 'next-on-pages', 'bin', 'index.js');
const buildEnv = {
  ...process.env,
};
if (buildEnv.PATH) {
  buildEnv.PATH = `${nodeBinDir};${buildEnv.PATH}`;
} else {
  buildEnv.PATH = nodeBinDir;
}
if (!buildEnv.PATHEXT) {
  buildEnv.PATHEXT = '.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC';
}
if (!buildEnv.NEXT_DISABLE_TURBOPACK) {
  buildEnv.NEXT_DISABLE_TURBOPACK = '1';
}
if ('TURBOPACK' in buildEnv) {
  delete buildEnv.TURBOPACK;
}

const cleanOutputDir = join(process.cwd(), '.vercel', 'output');
if (existsSync(cleanOutputDir)) {
  rmSync(cleanOutputDir, { recursive: true, force: true });
}
mkdirSync(cleanOutputDir, { recursive: true });

const vercelPatchMarker = '// __loopin_pages_build_no_win_symlink_patch__';
const vercelIndexPath = join(process.cwd(), 'node_modules', 'vercel', 'dist', 'index.js');

function patchVercelForWindowsSymlinkBuild() {
  if (!isWindows || !existsSync(vercelIndexPath)) {
    return;
  }

  const source = readFileSync(vercelIndexPath, 'utf8');
  if (source.includes(vercelPatchMarker)) {
    return;
  }

  const target = '  const existingFunctions = /* @__PURE__ */ new Map();';
  if (!source.includes(target)) {
    console.warn(`[pages:build] skipped Vercel patch: "${target}" not found in ${vercelIndexPath}`);
    return;
  }

  const patched = source.replace(
    target,
    `${vercelPatchMarker}\n  const existingFunctions = process.platform === "win32" ? null : /* @__PURE__ */ new Map();`
  );

  writeFileSync(vercelIndexPath, patched, 'utf8');
  console.log('[pages:build] patched Vercel output writer to avoid win32 symlinks');
}

if (isWindows && !canRunNpxCli && !existsSync(npxCommand)) {
  console.error(`[pages:build] neither npx-cli.js nor npx.cmd were found under: ${nodeBinDir}`);
  process.exit(1);
}

function resolveLocalBin(name) {
  if (!name) {
    return '';
  }

  const bin = {
    vercel: vercelBin,
    '@cloudflare/next-on-pages': nextOnPagesBin,
  }[name];

  return bin && existsSync(bin) ? bin : '';
}

function runNpx(args) {
  const commandIndex = args.findIndex((value, index) => index > 0 && !value.startsWith('-'));
  const command = commandIndex >= 0 ? args[commandIndex] : '';
  const commandArgs = commandIndex >= 0 ? args.slice(commandIndex + 1) : [];
  const localBin = resolveLocalBin(command);

  if (localBin) {
    const isJsCommand = localBin.toLowerCase().endsWith('.js');
    const targetCommand = isJsCommand ? process.execPath : localBin;
    const targetArgs = isJsCommand ? [localBin, ...commandArgs] : commandArgs;

    return new Promise((resolve, reject) => {
      const child = spawn(targetCommand, targetArgs, {
        stdio: 'inherit',
        shell: isWindows && !isJsCommand,
        env: buildEnv,
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`[pages:build] command failed (${code}): ${localBin} ${commandArgs.join(' ')}`));
      });
    });
  }

  return new Promise((resolve, reject) => {
    const command = canRunNpxCli ? process.execPath : npxCommand;
    const commandArgs = canRunNpxCli ? [npxCliScript, ...args] : args;

    const child = spawn(command, commandArgs, {
      stdio: 'inherit',
      shell: isWindows && !canRunNpxCli,
      env: buildEnv,
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`[pages:build] command failed (${code}): ${command} ${commandArgs.join(' ')}`));
    });
  });
}

async function main() {
  console.log('[pages:build] 1/2 vercel build');
  patchVercelForWindowsSymlinkBuild();
  await runNpx(['--yes', 'vercel', 'build']);

  console.log('[pages:build] 2/2 next-on-pages --skip-build');
  await runNpx(['--yes', '@cloudflare/next-on-pages', '--skip-build']);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
