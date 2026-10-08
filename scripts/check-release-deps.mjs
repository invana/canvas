#!/usr/bin/env node
/**
 * check-release-deps — a release ships npm versions, never local links.
 *
 * Day to day, the design kit is sometimes consumed from a local checkout
 * (`file:../design-kit/.local-packs/*.tgz` overrides, `pnpm link`, a
 * `link:` in a manifest). That is fine for development and must never reach a
 * tag, because the two ways it can leak both fail late or silently:
 *
 *  - **A manifest spec is published verbatim.** `pnpm pack` rewrites only
 *    `workspace:`; a `link:../x` / `file:../x` in `dependencies` lands in the
 *    npm tarball as-is, and every consumer's install breaks.
 *  - **An override outside the repo** fails CI's `pnpm install
 *    --frozen-lockfile` — but only after `release.sh` has pushed the release
 *    commit and the tag.
 *
 * So this reads the *committed* inputs of resolution — the same ones CI's
 * frozen install reads — and fails on anything that isn't a registry version:
 *
 *  1. `pnpm-workspace.yaml` `overrides`, and root `package.json`
 *     `pnpm.overrides` / `overrides` / `resolutions`.
 *  2. Every workspace `package.json`'s dependency fields.
 *  3. `pnpm-lock.yaml`: any `file:`, any `link:` that isn't a workspace package,
 *     any `resolution` that is git / a directory / a non-npm tarball.
 *  4. A `.pnpmfile.cjs`, which can rewrite resolution at install time.
 *
 * A local `node_modules` symlink that is not committed cannot reach a release
 * (CI installs from the lockfile), so it is not checked.
 *
 * Runs from `release.sh` (before the version bump) and the release workflow's
 * `resolve` job. Deliberately **not** part of `pnpm lint`: lint must stay green
 * while developing against a local kit. See
 * `docs/rfcs/feat/2026-10-08-a-release-can-ship-local-package-links.md`.
 *
 * **Allowing an exception:** add a row to `ALLOW` — a reviewed diff, not a flag.
 *
 *   node scripts/check-release-deps.mjs
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Deliberate exceptions: `{ name, spec, reason }`. `name` is the dependency
 * name, `spec` the exact spec string allowed for it. Empty on purpose.
 *
 * @type {{ name: string, spec: string, reason: string }[]}
 */
const ALLOW = [];

/** The manifest fields whose values are dependency specs. */
const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

/** Lockfile major this scanner understands; anything else fails loudly rather than passing blind. */
const LOCKFILE_MAJOR = "9";

/**
 * Classify one dependency spec.
 *
 * @param {string} spec
 * @returns {'local' | 'non-registry' | null} `null` for a registry version (or `workspace:` / `npm:` alias).
 */
function classify(spec) {
  const s = String(spec).trim();
  if (/^(workspace|npm|catalog):/.test(s)) return null;
  if (/^(file|link|portal):/.test(s) || /^(\.{1,2}\/|\/|~\/)/.test(s))
    return "local";
  if (/^(git\+|git:|github:|gitlab:|bitbucket:|https?:)/.test(s))
    return "non-registry";
  // GitHub shorthand `owner/repo` or `owner/repo#ref`. A semver range never contains `/`.
  if (/^[\w.-]+\/[\w.-]+(#.*)?$/.test(s)) return "non-registry";
  return null;
}

/** @type {{ where: string, name: string, spec: string, kind: string }[]} */
const problems = [];

/**
 * Record `spec` for `name` if it isn't a registry version and isn't allowed.
 *
 * @param {string} where Human-readable location (file › key).
 * @param {string} name Dependency name.
 * @param {string} spec The spec as written.
 * @param {string} [kind] Override the classification (lockfile findings).
 */
function check(where, name, spec, kind) {
  const k = kind ?? classify(spec);
  if (!k) return;
  if (ALLOW.some((a) => a.name === name && a.spec === spec)) return;
  problems.push({ where, name, spec, kind: k });
}

/** Strip matching surrounding quotes from a YAML scalar. */
const unquote = (s) => s.trim().replace(/^(['"])(.*)\1$/, "$2");

/**
 * Read a top-level block of `key: value` pairs from a flat YAML file — enough
 * for `pnpm-workspace.yaml`, without a YAML dependency.
 *
 * @param {string} text
 * @param {string} block Top-level key, e.g. `overrides`.
 * @returns {[string, string][]}
 */
function yamlBlockEntries(text, block) {
  const out = [];
  let inside = false;
  for (const line of text.split("\n")) {
    if (/^\S/.test(line)) {
      inside = line.startsWith(`${block}:`);
      continue;
    }
    if (!inside || /^\s*(#|$)/.test(line)) continue;
    const m = line.match(
      /^\s+((?:"[^"]*"|'[^']*'|[^:\s][^:]*?))\s*:\s*(.+?)\s*$/,
    );
    if (m) out.push([unquote(m[1]), unquote(m[2].replace(/\s+#.*$/, ""))]);
  }
  return out;
}

/** The workspace package globs from `pnpm-workspace.yaml` (`packages:` list), e.g. `apps/*`. */
function workspaceGlobs(text) {
  const globs = [];
  let inside = false;
  for (const line of text.split("\n")) {
    if (/^\S/.test(line)) {
      inside = line.startsWith("packages:");
      continue;
    }
    const m = inside && line.match(/^\s*-\s*(.+?)\s*$/);
    if (m) globs.push(unquote(m[1]));
  }
  return globs;
}

/** Workspace package directories (repo-relative), from `dir/*` globs. Root included. */
function workspaceDirs(globs) {
  const dirs = ["."];
  for (const g of globs) {
    const base = g.replace(/\/\*$/, "");
    const abs = join(ROOT, base);
    if (!existsSync(abs)) continue;
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (e.isDirectory() && existsSync(join(abs, e.name, "package.json")))
        dirs.push(`${base}/${e.name}`);
    }
  }
  return dirs;
}

// ── 1. Overrides ──────────────────────────────────────────────────────────
const wsText = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8");
for (const [name, spec] of yamlBlockEntries(wsText, "overrides")) {
  check("pnpm-workspace.yaml › overrides", name, spec);
}

const dirs = workspaceDirs(workspaceGlobs(wsText));

// ── 2. Manifests (root overrides fields too) ──────────────────────────────
for (const dir of dirs) {
  const file = dir === "." ? "package.json" : `${dir}/package.json`;
  const manifest = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  for (const field of DEP_FIELDS) {
    for (const [name, spec] of Object.entries(manifest[field] ?? {}))
      check(`${file} › ${field}`, name, spec);
  }
  const overrideFields = {
    "pnpm.overrides": manifest.pnpm?.overrides,
    overrides: manifest.overrides,
    resolutions: manifest.resolutions,
  };
  for (const [field, map] of Object.entries(overrideFields)) {
    for (const [name, spec] of Object.entries(map ?? {})) {
      if (typeof spec === "string") check(`${file} › ${field}`, name, spec);
    }
  }
}

// ── 3. Lockfile ───────────────────────────────────────────────────────────
const lockPath = join(ROOT, "pnpm-lock.yaml");
const lockLines = readFileSync(lockPath, "utf8").split("\n");
const version = (lockLines[0].match(/^lockfileVersion:\s*'?(\d+)/) ?? [])[1];
if (version !== LOCKFILE_MAJOR) {
  console.error(
    `check-release-deps: pnpm-lock.yaml is lockfileVersion ${version ?? "?"}; this check understands ${LOCKFILE_MAJOR}.x.\n` +
      "Update scripts/check-release-deps.mjs for the new format before releasing.",
  );
  process.exit(1);
}

const wsAbs = new Set(dirs.map((d) => resolve(ROOT, d)));
let section = "";
let importer = ".";
let dep = "";
let owner = "?";
let ownerFlagged = false;
lockLines.forEach((line, i) => {
  const at = `pnpm-lock.yaml:${i + 1}`;
  const top = line.match(/^(\w+):/);
  if (top) section = top[1];

  if (section === "overrides") {
    const m = line.match(
      /^\s+((?:"[^"]*"|'[^']*'|[^:\s][^:]*?))\s*:\s*(.+?)\s*$/,
    );
    if (m) check(`${at} › overrides`, unquote(m[1]), unquote(m[2]));
    return;
  }

  if (section === "importers") {
    const imp = line.match(/^ {2}(\S.*):$/);
    if (imp) importer = unquote(imp[1]);
    const d = line.match(/^ {6}(\S.*):$/);
    if (d) dep = unquote(d[1]);
    const v = line.match(/^ {8}version:\s*(.+?)\s*$/);
    if (!v) return;
    const ver = unquote(v[1]);
    const link = ver.match(/^link:(.+)$/);
    if (link) {
      // A link to another workspace package is how pnpm records `workspace:*` — fine.
      const target = resolve(ROOT, importer, link[1]);
      if (!wsAbs.has(target))
        check(`${at} › importers › ${importer}`, dep, ver, "local");
    } else if (/^file:/.test(ver)) {
      check(`${at} › importers › ${importer}`, dep, ver, "local");
    }
    return;
  }

  // packages: / snapshots: — keys carry `name@file:…` / `name@link:…`; resolutions say where bytes come from.
  const key = line.match(/^ {2}'?([^\s']+?)'?:\s*$/);
  if (key) {
    owner = key[1];
    const m = key[1].match(/^(@?[^@]+)@((?:file|link):[^(]+)/);
    ownerFlagged = Boolean(m);
    if (m) check(`${at} › ${section}`, m[1], m[2], "local");
  }
  const res = line.match(/^\s+resolution:\s*\{(.*)\}\s*$/);
  // The key already named a local source; its resolution would say the same thing twice.
  if (res && !ownerFlagged) {
    const body = res[1];
    const tarball = body.match(/tarball:\s*([^,}\s]+)/);
    const type = body.match(/type:\s*(\w+)/);
    const name = owner;
    if (type)
      check(
        `${at} › ${section}`,
        name,
        `resolution type: ${type[1]}`,
        type[1] === "directory" ? "local" : "non-registry",
      );
    else if (tarball && /^file:/.test(tarball[1]))
      check(`${at} › ${section}`, name, tarball[1], "local");
    else if (tarball && !tarball[1].startsWith("https://registry.npmjs.org/"))
      check(`${at} › ${section}`, name, tarball[1], "non-registry");
  }
});

// ── 4. pnpmfile ───────────────────────────────────────────────────────────
for (const f of [".pnpmfile.cjs", ".pnpmfile.mjs"]) {
  if (existsSync(join(ROOT, f)))
    problems.push({
      where: f,
      name: "(install hook)",
      spec: "present",
      kind: "local",
    });
}

// ── Report ────────────────────────────────────────────────────────────────
if (problems.length === 0) {
  console.log(
    `check-release-deps: OK — ${dirs.length} manifests, overrides and lockfile resolve to npm versions only.`,
  );
  process.exit(0);
}

console.error(
  `check-release-deps: ${problems.length} dependency source(s) are not npm versions — refusing to release.\n`,
);
for (const p of problems)
  console.error(`  ✗ [${p.kind}] ${p.where}\n      ${p.name}: ${p.spec}`);
console.error(
  "\nA release must resolve every dependency from the npm registry.\n" +
    "Switch back: remove the local override / link, set a published version, run `pnpm install`, commit, rerun.\n" +
    `A deliberate exception goes in ALLOW in ${relative(process.cwd(), fileURLToPath(import.meta.url))}.`,
);
process.exit(1);
