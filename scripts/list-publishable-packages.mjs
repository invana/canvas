#!/usr/bin/env node
/**
 * list-publishable-packages — the release matrix, derived from the workspace.
 *
 * Prints one JSON array of `{ pkg, dir }` for every non-private package under
 * `packages/`, which `.github/workflows/release.yml` feeds straight into the
 * `dist-branches` matrix via `fromJSON`. `pkg` is the npm name without its
 * scope: it names both the matrix job and the branch (`releases/<pkg>`).
 *
 * Derived rather than hand-listed (D-1 of
 * `docs/rfcs/feat/2026-09-19-packages-are-only-installable-from-npm.md`) — a new
 * layout or layer package gets a release branch by existing, with no second list
 * to keep in step. `private: true` is the only opt-out, which is what already
 * keeps `@repo/*` and the apps off npm.
 *
 *   node scripts/list-publishable-packages.mjs
 *   → [{"pkg":"canvas","dir":"canvas"},…]
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PACKAGES = join(ROOT, 'packages');

const entries = readdirSync(PACKAGES, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(PACKAGES, e.name, 'package.json')))
  .map((e) => ({
    dir: e.name,
    manifest: JSON.parse(readFileSync(join(PACKAGES, e.name, 'package.json'), 'utf8')),
  }))
  .filter(({ manifest }) => !manifest.private)
  // `@invana/graph-layout-elkjs` -> `graph-layout-elkjs`
  .map(({ dir, manifest }) => ({ pkg: manifest.name.replace(/^@[^/]+\//, ''), dir }))
  .sort((a, b) => a.pkg.localeCompare(b.pkg));

// An empty matrix would make `dist-branches` vacuously green, which reads as a
// successful release that shipped nothing.
if (entries.length === 0) {
  console.error('list-publishable-packages: no publishable package found under packages/');
  process.exit(1);
}

process.stdout.write(`${JSON.stringify(entries)}\n`);
