---
id: feat-2026-10-08-a-release-can-ship-local-package-links
type: feat
title: A release refuses to cut while any dependency resolves to a local path
status: accepted
opened: 2026-10-08
decided: 2026-10-08
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas, pkg:@invana/renderer-pixijs, pkg:@invana/canvas-telemetry-otel, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui, pkg:@invana/canvas-designer, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-10-04-canvas-ui-uses-the-kit-workbook }
  - { predicate: relates-to, object: rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas }
  - { predicate: relates-to, object: rfc:feat-2026-09-19-packages-are-only-installable-from-npm }
---

**Summary:** the maintainer regularly switches the design kit between local packs and npm.
Nothing checks the switch-back before a release. This adds one script, `check-release-deps`,
that fails when any committed dependency resolves to a local path, and runs it in
`release.sh` and in the release workflow.

| | |
|---|---|
| **What breaks today** | A local `file:`/`link:` spec can reach a tag. In the manifest it is **published verbatim** (M2). In an override it fails CI only **after** the tag and release commit are pushed (M3) |
| **What changes** | One new script (F1), and two places that call it (F2, F3). Nothing runs it on `pnpm lint` (D-1) |
| **Row status** | proposed 0 · accepted 0 · implemented 4 · landed 0 · deferred 1 · rejected 0 |
| **Open decisions** | none: D-1 to D-3 decided 2026-10-08 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| M1 | The kit was consumed from local tarballs for 4 days via 9 `overrides`, removed 2026-10-08 | `file:pnpm-workspace.yaml` | rfc:feat-2026-10-04-canvas-ui-uses-the-kit-workbook, history 2026-10-08 |
| M2 | `pnpm pack` keeps `link:../foo` and `file:../foo` in the packed `package.json` unchanged. Only `workspace:` is rewritten | `pnpm pack` on a scratch package | Packed manifest still reads `"foo": "link:../foo"`. A consumer's install fails |
| M3 | `release.sh` checks branch, clean tree and tag. It does not check dependency sources | `file:release.sh#L27-L41` | — |
| M4 | The release workflow's first failure point for an out-of-repo override is `pnpm install --frozen-lockfile` in the `publish` job, after the tag push | `file:.github/workflows/release.yml#L118-L119` | The tag `v*` and the `release:` commit are already on `origin` by then |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | CI already protects us | Partly. Only for paths outside the repo, and only after the tag is pushed | M4. A `file:` inside the repo, or any `link:`/`file:` in a manifest, installs fine and publishes (M2) |
| R2 | Add it to `pnpm lint` | Rejected as default (D-1) | Lint would fail every time the maintainer works against the local kit, which is the workflow this protects |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| 1 | Read the **committed** sources of resolution: root `pnpm-workspace.yaml` `overrides`, root `package.json` `pnpm.overrides`, every workspace `package.json` dep field, `pnpm-lock.yaml`, and `.pnpmfile.cjs` | These are the only inputs that `pnpm install --frozen-lockfile` reads in CI | A local `node_modules` symlink that isn't committed can't reach a release, so it isn't checked |
| 2 | A spec is **local** when it is `file:`, `link:` or `portal:`, or a bare path (`./`, `../`, `/`, `~`). `workspace:` is allowed | — | Covers `pnpm link`, `pnpm add ../x`, packed tarballs |
| 3 | A spec is **non-registry** when it is `git+…`, `github:…`, or an `http(s)` tarball | — | "Only versions", as asked. Same failure, separate message |
| 4 | In the lockfile, `link:` is allowed only when it resolves to a workspace package folder (`link:../../packages/canvas`). Any `file:` or `resolution: {tarball…}` / `{type: git}` fails | `file:pnpm-lock.yaml` today: 0 hits after the 2026-10-08 switch | The lockfile catches what a manifest can hide (a transitive override) |
| 5 | An `ALLOW` table at the top of the script, `{ name, spec, reason }`, works like `BOUNDARIES` in `file:scripts/check-renderer-boundary.mjs` | — | A deliberate exception is a reviewed diff, not a flag |
| 6 | Output names the file, the key and the spec, and ends with how to switch back (`delete the override, pnpm install`) | — | One command to rerun |

## 3. Prior art

| Doc | Relation | Status | What survives |
|-----|----------|--------|---------------|
| `file:scripts/check-renderer-boundary.mjs` | relates-to | landed | The table-of-rules shape and the exit-code contract |
| `file:scripts/check-node-import.mjs` | relates-to | landed | Header-comment style: why the check exists, with the incident |
| rfc:feat-2026-09-19-packages-are-only-installable-from-npm | relates-to | landed | The `resolve` job in the release workflow is where shared gates go |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | implemented | `file:scripts/check-release-deps.mjs` (new), `file:package.json` | The check from §2, dependency-free Node (YAML read with a small line parser for `overrides`; the lockfile scanned line by line, as `check-api-surface` does). Root script `"check-release-deps"` | A local link fails with its file and key | low: read-only, no new deps | — |
| F2 | defect | implemented | `file:release.sh#L36` | Run `node scripts/check-release-deps.mjs` after the clean-tree check, before the version bump | Fails **before** any commit or tag is made | low | F1 |
| F3 | defect | implemented | `file:.github/workflows/release.yml` `resolve` job | Run it right after checkout in `resolve` | Every downstream job (`publish`, `dist-branches`, `notes`, `storybook`) needs `resolve`, so a manually pushed tag deploys nothing | low: Storybook redeploy (blank-tag dispatch) is gated too, intentionally | F1 |
| F4 | defect | implemented | `file:docs/README.md`, root `file:CLAUDE.md` (Commands block, one line) | List the check next to the other `check-*` scripts | Discoverable | low | F1 |
| F5 | dressing | deferred | `file:scripts/kit-source.mjs` (new), `file:package.json` | `pnpm kit:local` / `pnpm kit:npm`: write or remove the `@invana/*` overrides and run `pnpm install` | Makes the switch one command. Doesn't prevent a bad release, F1–F3 do | medium: edits `pnpm-workspace.yaml` programmatically | D-2 |

## 5. Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| U1 | `pnpm-lock.yaml` v9 format | F1 scans `link:`/`file:`/`resolution:` lines | A lockfile format bump could make it miss entries. Mitigation: fail if `lockfileVersion` isn't `9.x` |
| U2 | pnpm 10's `overrides` in `pnpm-workspace.yaml` | Where `pnpm link` and the local-pack workflow write | Also reads `package.json` `pnpm.overrides` in case it moves back |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| D1 | `release.sh` users (maintainer) | script | A release with a local link now stops before bumping | Switch back to npm, then rerun |
| D2 | `release.yml` blank-tag Storybook redeploy | CI | Also stops on a local link | None. Such a link can't install in CI anyway |
| D3 | Published packages | npm | None. No manifest or export changes | — |
| D4 | `pnpm lint` | script | Unchanged (D-1) | — |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | **Control**: run on the current tree | repo after 2026-10-08 switch | exit 0 → **OK, 23 manifests** | F1 |
| V2 | pass | Re-add one `file:../design-kit/...tgz` override, run | scratch edit | exit 1, names `pnpm-workspace.yaml` → `@invana/ui` → **as expected** | F1 |
| V3 | pass | Put `"@invana/ui": "link:../../design-kit/packages/ui"` in `canvas-ui` `devDependencies`, run | scratch edit | exit 1, names the manifest and the field → **3 findings: `link:` (local), `github:` and `https:` (non-registry)** | F1 |
| V4 | pass | Lockfile with a `file:` resolution and no manifest change | scratch edit | exit 1, names `pnpm-lock.yaml` → **out-of-repo importer `link:`, `file:` package key, git resolution all flagged, with line numbers. `main`'s pre-switch tree: 64 findings across all 9 kit packages** | F1 |
| V5 | pass | Workspace `link:../../packages/canvas` in the lockfile | current tree | not flagged → **95 workspace links, 0 flagged** | F1 |
| V6 | pass | `./release.sh 9.9.9` with V2's override present | scratch branch | stops before `npm version`; no commit, no tag → **in a scratch clone: exit 1, no "Bumping", HEAD unchanged, no tag, tree clean** | F2 |
| V7 | pass | `actionlint` / workflow syntax, plus reading the job graph | `release.yml` | the step is in `resolve` → **`actionlint` not installed; YAML parses, `resolve` steps = target, Checkout, the check, Enumerate, Summary** | F3 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D-1 | Also run it in `pnpm lint`? | (a) release only; (b) lint too; (c) lint as warning | **(a).** Lint must pass while working against the local kit. The release gates are where it matters | accepted |
| D-2 | Add the `kit:local` / `kit:npm` switcher (F5)? | (a) yes, here; (b) separate RFC later; (c) no | **(b).** Useful given how often you switch, but it's convenience, not the guard. The local-pack path layout lives in the design-kit repo and should be decided there | accepted |
| D-3 | Flag `git`/`github:`/`http` tarball deps too, not just local paths? | (a) yes; (b) local paths only | **(a).** You asked for "only the versions". None exist today, so it costs nothing, and `ALLOW` handles a future exception | accepted |

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-10-08 | Opened | proposed | Maintainer asked for a release checkpoint after switching the kit back to npm. M2 confirmed with a scratch `pnpm pack` |
| 2026-10-08 | Approved: F1–F4; D-1 (a), D-2 (b), D-3 (a) | accepted | Maintainer "go". F5 deferred to its own RFC (D-2) |
| 2026-10-08 | F1–F4 implemented, V1–V7 pass | implemented | Branch `chore/design-kit-from-npm`, not committed. Rows reach `landed` when merged to `main` |
| 2026-10-08 | Learned | — | (1) The lockfile names one local source twice (the package key, then its `resolution`), so findings are deduped per entry. (2) `main`'s tarball setup yields 64 findings: one per override plus every importer and snapshot that resolves through it. Noisy, but each names its line. (3) `release.sh` can't be tested in a worktree (it needs `main` and a clean tree), so V6 ran in a throwaway clone |
