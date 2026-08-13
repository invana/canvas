#!/usr/bin/env node
/**
 * check-api-surface — pin the public API surface of the engine barrels.
 *
 * The barrels deliberately keep one `export *` each (the spec vocabulary, exported
 * wholesale from `@invana/canvas-core`'s specs barrel). The cost of a star is that
 * surface changes ride through it with no reviewable diff — adding one type to
 * `specs/shape.ts` silently grows three public APIs. This check restores the
 * guarantee named exports would give (a reviewed diff) without hand-maintaining
 * ~150 names in three places:
 *
 *   - resolve every export of each package's **built** `dist/*.d.ts` entry
 *     (the TypeScript checker follows `export *` across package boundaries);
 *   - compare the sorted name list against the checked-in snapshot in `api/`;
 *   - fail with an added/removed diff when they disagree.
 *
 * A legitimate surface change regenerates the snapshot in the same PR:
 *
 *   pnpm build && node scripts/check-api-surface.mjs --write
 *
 * Scope (D-1 of `docs/rfcs/feat/2026-08-12-star-exports-hide-surface-drift.md`):
 * the three engine barrels, where the stars are. Extending = one entry below.
 *
 * Requires `dist/` to exist (this reads the *built* surface — exactly what npm
 * consumers see). Run `pnpm build` first; CI does.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SNAP_DIR = join(ROOT, 'api');
const WRITE = process.argv.includes('--write');

/** Package entries to pin: snapshot file ← list of built d.ts entry points. */
const TARGETS = [
  {
    name: '@invana/canvas-core',
    snapshot: 'canvas-core.surface.txt',
    entries: [
      { label: '.', file: 'packages/canvas-core/dist/index.d.ts' },
      { label: './specs', file: 'packages/canvas-core/dist/specs/index.d.ts' },
    ],
  },
  {
    name: '@invana/canvas-store',
    snapshot: 'canvas-store.surface.txt',
    entries: [{ label: '.', file: 'packages/canvas-store/dist/index.d.ts' }],
  },
  {
    name: '@invana/canvas',
    snapshot: 'canvas.surface.txt',
    entries: [{ label: '.', file: 'packages/canvas/dist/index.d.ts' }],
  },
];

/** Resolve the full export-name list of one d.ts entry (stars followed). */
function exportsOf(entryFile) {
  const abs = join(ROOT, entryFile);
  if (!existsSync(abs)) {
    console.error(`✗ ${entryFile} not found — run \`pnpm build\` before the surface check.`);
    process.exit(1);
  }
  const program = ts.createProgram([abs], {
    // Bundler resolution follows the workspace symlinks in each package's
    // node_modules, so `export * from '@invana/canvas-core/specs'` resolves.
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(abs);
  const moduleSymbol = checker.getSymbolAtLocation(sf);
  if (!moduleSymbol) {
    console.error(`✗ ${entryFile}: could not resolve a module symbol (empty file?).`);
    process.exit(1);
  }
  return [...new Set(checker.getExportsOfModule(moduleSymbol).map((s) => s.name))].sort();
}

/** Render one package's snapshot content. */
function render(target) {
  const lines = [
    `# ${target.name} — public API surface (generated; do not hand-edit)`,
    `# Regenerate: pnpm build && node scripts/check-api-surface.mjs --write`,
  ];
  for (const entry of target.entries) {
    const names = exportsOf(entry.file);
    lines.push('', `## ${entry.label} (${names.length} exports)`, ...names);
  }
  return lines.join('\n') + '\n';
}

let failed = false;
for (const target of TARGETS) {
  const snapPath = join(SNAP_DIR, target.snapshot);
  const actual = render(target);

  if (WRITE) {
    mkdirSync(SNAP_DIR, { recursive: true });
    writeFileSync(snapPath, actual);
    console.log(`✓ wrote api/${target.snapshot}`);
    continue;
  }

  if (!existsSync(snapPath)) {
    console.error(`✗ api/${target.snapshot} missing — run with --write to create it.`);
    failed = true;
    continue;
  }

  const expected = readFileSync(snapPath, 'utf8');
  if (expected === actual) {
    console.log(`✓ ${target.name} surface unchanged`);
    continue;
  }

  const want = new Set(expected.split('\n'));
  const have = new Set(actual.split('\n'));
  const added = [...have].filter((l) => l && !l.startsWith('#') && !want.has(l));
  const removed = [...want].filter((l) => l && !l.startsWith('#') && !have.has(l));
  console.error(`\n✗ ${target.name} public surface drifted from api/${target.snapshot}:`);
  for (const l of added) console.error(`  + ${l}`);
  for (const l of removed) console.error(`  - ${l}`);
  console.error(
    '  If intentional, regenerate: pnpm build && node scripts/check-api-surface.mjs --write',
  );
  failed = true;
}

if (failed) process.exit(1);
if (!WRITE) console.log('✓ api surfaces intact');
