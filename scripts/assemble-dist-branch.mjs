#!/usr/bin/env node
/**
 * assemble-dist-branch — stage one package for its `releases/<pkg>` branch.
 *
 * The `dist-branches` stage of `.github/workflows/release.yml` mirrors every
 * published package onto a branch so it can be installed straight from git:
 *
 *   pnpm add github:invana/canvas#releases/graph-layout-elkjs
 *
 * A branch consumer gets no workspace, no turbo and no `@repo/*` configs, so the
 * tree pushed there is not the source directory — it is the npm tarball's
 * content with a manifest that resolves off-workspace. This script builds that
 * tree, and lives here rather than inline in the YAML (D-3 of
 * `docs/rfcs/feat/2026-09-19-packages-are-only-installable-from-npm.md`) because
 * it is the step that can ship a broken manifest to a real consumer — so it has
 * to be runnable and reviewable locally:
 *
 *   pnpm build && node scripts/assemble-dist-branch.mjs packages/graph /tmp/out
 *
 * Four things it does, each load-bearing:
 *
 *   1. copies exactly what `files` declares, plus the docs npm always includes;
 *   2. drops `devDependencies` — all 18 packages carry `@repo/typescript-config`
 *      and `@repo/eslint-config` as `workspace:*` devDeps, and both are private
 *      and never published, so keeping them fails every git install;
 *   3. rewrites `workspace:*` to `^<version>` in the dependency fields that
 *      survive — the rewrite `pnpm publish` does for npm, done here for the branch;
 *   4. fails loudly when `dist/` is missing, because a build artifact that did
 *      not arrive would otherwise force-push an empty package and break
 *      consumers silently.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [pkgDir, outDir] = process.argv.slice(2);

if (!pkgDir || !outDir) {
  console.error('usage: assemble-dist-branch.mjs <package-dir> <out-dir>');
  process.exit(1);
}

const manifestPath = join(pkgDir, 'package.json');
if (!existsSync(manifestPath)) {
  console.error(`assemble-dist-branch: no package.json at ${manifestPath}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// (1) Ship what `files` declares, plus the two documents npm includes whether or
// not they are listed. Every package here declares `["dist"]`; the fallback
// matches npm's own default for a package that declares nothing.
const declared = pkg.files ?? ['dist'];
for (const entry of new Set([...declared, 'README.md', 'LICENSE'])) {
  // cpSync takes paths, not patterns. No package uses a glob today; if one
  // starts, this warns instead of silently shipping less than npm does.
  if (/[*?[\]]/.test(entry)) {
    console.log(`::warning::${pkg.name} declares a glob in files["${entry}"] — not copied to the branch`);
    continue;
  }
  const src = join(pkgDir, entry);
  if (existsSync(src)) cpSync(src, join(outDir, entry), { recursive: true });
  else if (declared.includes(entry))
    console.log(`::warning::${pkg.name} declares files["${entry}"] but it does not exist`);
}

// (4) The guard that keeps a failed artifact download from becoming a silent
// bad release.
if (declared.includes('dist') && !existsSync(join(outDir, 'dist'))) {
  console.error(`assemble-dist-branch: ${pkg.name} — dist/ is missing; the build artifact did not arrive`);
  process.exit(1);
}

// A git dependency runs `prepare` on install, which would try to rebuild from
// source the branch does not carry. None of these packages defines one today —
// this keeps that true for whoever adds the first.
for (const hook of ['prepare', 'preinstall', 'install', 'postinstall', 'prepack', 'prepublishOnly'])
  delete pkg.scripts?.[hook];
if (pkg.scripts && Object.keys(pkg.scripts).length === 0) delete pkg.scripts;

// (2) The build toolchain is not the consumer's problem, and `@repo/*` is not
// resolvable off-workspace.
delete pkg.devDependencies;

// (3) `workspace:*` / `workspace:^` / `workspace:~` -> `^<version>`; an explicit
// `workspace:1.2.3` keeps its range. Lockstep versioning is what makes the
// star form resolvable at all.
const DEP_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'];
for (const field of DEP_FIELDS) {
  for (const [name, range] of Object.entries(pkg[field] ?? {})) {
    if (!String(range).startsWith('workspace:')) continue;
    const rest = String(range).slice('workspace:'.length);
    pkg[field][name] = rest === '*' || rest === '^' || rest === '~' ? `^${pkg.version}` : rest;
  }
}

// Belt and braces for (2): a private workspace config reaching a field that
// survives would publish a branch nobody can install.
for (const field of DEP_FIELDS) {
  const priv = Object.keys(pkg[field] ?? {}).filter((name) => name.startsWith('@repo/'));
  if (priv.length > 0) {
    console.error(`assemble-dist-branch: ${pkg.name} — ${field} references private ${priv.join(', ')}`);
    process.exit(1);
  }
}

writeFileSync(join(outDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`${pkg.name}@${pkg.version} -> ${outDir}`);
