#!/usr/bin/env node
/**
 * The renderer boundary gate.
 *
 * > **Everything that touches a drawing library lives in `@invana/renderer-pixijs`.
 * > Nothing else does.**
 *
 * That invariant is what the whole P6 split bought, and it is worth exactly as
 * much as its enforcement. A `grep` that a human remembers to run is worth
 * nothing; this exits non-zero.
 *
 * **Why a script and not just an ESLint rule.** The shared config loads
 * `eslint-plugin-only-warn`, which downgrades every rule to a warning on
 * purpose — so an ESLint rule can *surface* a violation in the editor but can
 * never fail a build. Both exist: the rule for the fast feedback, this for the
 * gate. If you change one, change the other.
 *
 * Run: `pnpm check-boundaries` (also part of the root `pnpm lint`).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

/** Drawing libraries that may only be imported inside an allowed package. */
const DRAWING_LIBS = [/from\s+['"]pixi\.js['"]/, /from\s+['"]pixi-viewport['"]/, /from\s+['"]three['"]/];

/** Packages permitted to import a drawing library — the backends themselves. */
const BACKENDS = ['packages/renderer-pixijs', 'packages/renderer-threejs'];

/** Trees to scan. Built output and deps are not source. */
const SCAN = ['packages', 'apps'];
const SKIP = new Set(['node_modules', 'dist', '.turbo', 'storybook-static', 'coverage', '.next']);

/** @type {{ file: string; line: number; text: string }[]} */
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
    if (BACKENDS.some((b) => rel.startsWith(b + '/'))) continue;

    const src = readFileSync(full, 'utf8');
    if (!DRAWING_LIBS.some((re) => re.test(src))) continue;

    src.split('\n').forEach((text, i) => {
      if (DRAWING_LIBS.some((re) => re.test(text))) {
        violations.push({ file: rel, line: i + 1, text: text.trim() });
      }
    });
  }
}

for (const dir of SCAN) walk(join(ROOT, dir));

if (violations.length === 0) {
  console.log('✓ renderer boundary intact — no drawing library imported outside a backend package');
  process.exit(0);
}

console.error(
  `\n✗ renderer boundary violated — ${violations.length} import(s) of a drawing library ` +
    `outside ${BACKENDS.join(' / ')}:\n`,
);
for (const v of violations) console.error(`  ${v.file}:${v.line}\n    ${v.text}`);
console.error(
  '\nA drawing library belongs to a backend package. If the engine needs something ' +
    'from it, add it to the renderer contract (`packages/canvas/src/renderer/IRenderer.ts`) ' +
    'and implement it in the backend instead.\n' +
    'See docs/renderer-split-design.md §1.\n',
);
process.exit(1);
