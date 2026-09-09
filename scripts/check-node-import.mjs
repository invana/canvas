#!/usr/bin/env node
/**
 * check-node-import — import every published barrel in a plain Node process.
 *
 * Every other check in this repo runs through a bundler: `pnpm build` is tsup,
 * `pnpm test` is vitest, Storybook is Vite. Bundlers resolve a dependency's
 * `module` field and interop CommonJS on their own, so a package can be
 * *unimportable by Node* while all of them stay green.
 *
 * That is not hypothetical — it shipped. `pixi-viewport@6.0.3` publishes no
 * `exports` map, so Node falls back to `main` (a UMD CommonJS bundle) while
 * bundlers take `module` (real ESM). `@invana/renderer-pixijs` imported
 * `Viewport` *by name*, which only the ESM build provides, and once
 * `@invana/canvas` imported the backend at module scope, `import '@invana/canvas'`
 * threw in Node before any user code ran — with build, check-types, test,
 * check-boundaries and the stories all passing. See
 * `docs/rfcs/fix/2026-09-10-importing-canvas-in-node-throws-on-pixi-viewport.md`.
 *
 * So: spawn a real `node`, import each built barrel, and fail on a throw. This
 * catches the *class* — missing `exports` maps, CJS named-import interop, a
 * dependency that assumes `window` at module scope — not just the instance.
 *
 * Adding a package = one entry in `BARRELS` below.
 *
 * Requires `dist/` to exist (this reads the *built* artefact — exactly what npm
 * consumers get). Run `pnpm build` first; CI does.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The barrels an npm consumer can `import`. Renderer-free packages are the ones
 * that most need this — they advertise a headless/Node-capable surface — but the
 * backend is listed too, since it is where the interop defect actually lives.
 */
const BARRELS = [
  '@invana/canvas-core',
  '@invana/canvas-store',
  '@invana/canvas',
  '@invana/renderer-pixijs',
  '@invana/graph',
];

/** Resolve a workspace package's built ESM entry, or `null` if it isn't built. */
function distEntry(pkg) {
  const dir = join(ROOT, 'packages', pkg.replace('@invana/', ''));
  const entry = join(dir, 'dist', 'index.js');
  return existsSync(entry) ? entry : null;
}

/**
 * Import one barrel in a fresh `node`. Returns `null` on success, or the first
 * meaningful line of stderr on failure.
 *
 * A subprocess per barrel is deliberate: a module graph is cached per process,
 * so importing them together would let the first success mask a later failure,
 * and a `SyntaxError` at link time would take the whole run down with it.
 */
async function importsCleanly(entry) {
  try {
    await execFileAsync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(entry)})`], {
      cwd: ROOT,
      timeout: 60_000,
    });
    return null;
  } catch (err) {
    const stderr = String(err.stderr ?? err.message ?? '');
    const line = stderr.split('\n').find((l) => /Error|error/.test(l.trim()));
    return (line ?? stderr.split('\n')[0] ?? 'unknown failure').trim();
  }
}

const failures = [];
const skipped = [];

for (const pkg of BARRELS) {
  const entry = distEntry(pkg);
  if (!entry) {
    skipped.push(pkg);
    continue;
  }
  const failure = await importsCleanly(entry);
  if (failure) failures.push({ pkg, failure });
}

if (skipped.length) {
  console.error(`✗ not built: ${skipped.join(', ')} — run \`pnpm build\` first`);
  process.exit(1);
}

if (failures.length) {
  console.error('✗ these packages cannot be imported by plain Node:\n');
  for (const { pkg, failure } of failures) {
    console.error(`  ${pkg}\n    ${failure}\n`);
  }
  console.error(
    'A bundler hides this — it resolves `module` and interops CJS itself. Node does not.\n' +
      'Usual cause: a dependency with no `exports` map whose `main` is CommonJS, imported\n' +
      'by name. Fix it in the package that owns the dependency (inline it with tsup\n' +
      '`noExternal`, or import it in a way both resolvers agree on) — not by making the\n' +
      'import lazy, which only moves the throw to the first call.',
  );
  process.exit(1);
}

console.log(`✓ node-import intact — ${BARRELS.length} barrels import cleanly in plain Node`);
