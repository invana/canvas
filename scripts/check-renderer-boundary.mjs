#!/usr/bin/env node
/**
 * The package-boundary gate.
 *
 * Two invariants, one mechanism. Each says *this library may be imported here and
 * nowhere else*, and each is worth exactly as much as its enforcement — a `grep`
 * a human remembers to run is worth nothing, so this exits non-zero.
 *
 * > **1. Drawing.** Everything that touches a drawing library lives in
 * > `@invana/renderer-pixijs`. Nothing else does. (What the P6 split bought.)
 *
 * > **2. State.** Everything that touches a state library lives behind the
 * > `ReactiveStore` port's adapter in `@invana/canvas-store`. Nothing else does —
 * > that is what keeps the backend swappable for Yjs.
 *
 * Invariant 2 was prose-only for a long time and drifted: `@invana/canvas` grew a
 * second, raw-zustand store container that no history / telemetry / CRDT code
 * could observe. Adding it here is the fix for the *class* of bug, not just the
 * instance. See `docs/rfcs/fix/2026-08-10-zustand-imported-outside-canvas-store.md`.
 *
 * **Why a script and not just an ESLint rule.** The shared config loads
 * `eslint-plugin-only-warn`, which downgrades every rule to a warning on
 * purpose — so an ESLint rule can *surface* a violation in the editor but can
 * never fail a build. Both exist: the rule for the fast feedback, this for the
 * gate. If you change one, change the other (`packages/eslint-config/base.js`).
 *
 * **Adding a boundary:** append a row to `BOUNDARIES`. `libs` are matched against
 * import specifiers (bare or subpath, e.g. `zustand` also catches
 * `zustand/vanilla`); `allowed` are path prefixes permitted to import them.
 *
 * Run: `pnpm check-boundaries` (also part of the root `pnpm lint`).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

/**
 * Build a matcher for `from 'lib'` and `from 'lib/anything'`, so a boundary
 * cannot be walked around via a subpath import (`zustand/vanilla`,
 * `immer/plugins`). Matches both quote styles and `import(...)` forms.
 */
const importOf = (lib) =>
  new RegExp(`from\\s+['"]${lib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/[^'"]*)?['"]`);

/** @type {{ name: string; libs: string[]; allowed: string[]; remedy: string }[]} */
const BOUNDARIES = [
  {
    name: 'renderer',
    libs: ['pixi.js', 'pixi-viewport', 'three'],
    allowed: ['packages/renderer-pixijs', 'packages/renderer-threejs'],
    remedy:
      'A drawing library belongs to a backend package. If the engine needs something ' +
      'from it, add it to the renderer contract (`packages/canvas/src/renderer/IRenderer.ts`) ' +
      'and implement it in the backend instead.\nSee docs/renderer-split-design.md §1.',
  },
  {
    name: 'state',
    libs: ['zustand'],
    // Only the adapter. The rest of the kernel programs against its own port.
    allowed: ['packages/canvas-store/src/adapters/zustand'],
    remedy:
      'Program against the `ReactiveStore` port, not a state library. Build stores with ' +
      '`createReactiveStore` (or `createMemoryStore`) from `@invana/canvas-store`; that is ' +
      'what makes writes emit patches, so history, telemetry and a future Yjs backend can ' +
      'observe them.\nSee docs/canvas-state-plan.md §12 D2.',
  },
  {
    name: 'immer',
    libs: ['immer'],
    // The patch/history/telemetry machinery is immer's only legitimate caller;
    // it is the layer that turns mutations into the patches the port exposes.
    allowed: ['packages/canvas-store/src'],
    remedy:
      'immer is the kernel\'s patch engine, not a general utility. Mutate through ' +
      '`store.update(recipe)` and let the port produce the patches.',
  },
];

/** Trees to scan. Built output and deps are not source. */
const SCAN = ['packages', 'apps'];
const SKIP = new Set(['node_modules', 'dist', '.turbo', 'storybook-static', 'coverage', '.next']);

/** @type {{ boundary: string; file: string; line: number; text: string }[]} */
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) continue;

    const rel = relative(ROOT, full).split(sep).join('/');
    const src = readFileSync(full, 'utf8');

    for (const boundary of BOUNDARIES) {
      if (boundary.allowed.some((a) => rel === a || rel.startsWith(a + '/'))) continue;

      const matchers = boundary.libs.map(importOf);
      if (!matchers.some((re) => re.test(src))) continue;

      src.split('\n').forEach((text, i) => {
        if (matchers.some((re) => re.test(text))) {
          violations.push({ boundary: boundary.name, file: rel, line: i + 1, text: text.trim() });
        }
      });
    }
  }
}

for (const dir of SCAN) walk(join(ROOT, dir));

if (violations.length === 0) {
  console.log(
    `✓ boundaries intact — ${BOUNDARIES.map((b) => b.name).join(', ')} (no restricted library ` +
      'imported outside its owning package)',
  );
  process.exit(0);
}

console.error(`\n✗ ${violations.length} boundary violation(s):\n`);
for (const boundary of BOUNDARIES) {
  const hits = violations.filter((v) => v.boundary === boundary.name);
  if (hits.length === 0) continue;
  console.error(
    `  [${boundary.name}] ${boundary.libs.join(' / ')} — allowed only in ` +
      `${boundary.allowed.join(' / ')}:`,
  );
  for (const v of hits) console.error(`    ${v.file}:${v.line}\n      ${v.text}`);
  console.error(`\n  ${boundary.remedy}\n`);
}
process.exit(1);
