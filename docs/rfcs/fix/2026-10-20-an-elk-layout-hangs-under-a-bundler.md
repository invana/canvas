---
id: fix-2026-10-20-an-elk-layout-hangs-under-a-bundler
type: fix
title: ELK's default worker loads under a bundler, a dead worker falls back, and the fallback constructs
status: accepted
opened: 2026-10-20
decided: 2026-10-20
landed: null
packages: [pkg:@invana/graph-layout-elkjs]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph-layout-elkjs/src/ElkLayout.ts#L628-L632" }
  - { predicate: caused-by, object: "file:packages/graph-layout-elkjs/src/ElkLayout.ts#L139-L156" }
  - { predicate: manifests-in, object: "file:studio/packages/explorer/src/ExplorerCanvas.tsx (invana repo)" }
  - { predicate: relates-to, object: rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story }
---

## Summary

| | |
|---|---|
| **What breaks** | Picking an ELK layout hangs silently: no positions, no `layout:run:end`. The synchronous fallback throws `BundledELK is not a constructor`. Every host passes its own `workerFactory` (Studio ×4) |
| **Root cause** | (A) the default factory puts a **bare package specifier** in `new URL(…, import.meta.url)` — unbundled it resolves to `dist/elkjs/lib/…`, pre-bundled to `.vite/deps/…`; neither exists. (B) `elk-api` wires `onmessage` only: a worker whose script fails never answers and nothing rejects. (C) `elk.bundled.js` is a UMD; served raw as ESM it has no exports and sets `window.ELK` |
| **Not the cause** | the worker script (it installs `onmessage` in a worker); `type: 'classic'` (correct for this GWT script) |
| **Defect rows** | `E1` (A) · `E2` (B) · `E3` (C) |
| **Row status** | proposed 0 · accepted 0 · implemented 3 · landed 0 |
| **Open decisions** | none |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `new URL('elkjs/lib/elk-worker.min.js', import.meta.url)` | `ElkLayout.ts#L628-L632` (before) | a relative path under the importer, not the package |
| 2 | the Worker constructor does not throw on a bad script; the failure is an async `error` event | `ElkLayout.ts#L139-L148` (before) | the sync fallback is never reached |
| 3 | `PromisedWorker` has no `onerror`, no timeout | `elkjs/lib/elk-api.js#L150-L170` | `elk.layout()` never settles — a silent hang |
| 4 | `const { default: BundledELK } = await import('elkjs/lib/elk.bundled.js')` on a raw UMD | `elk.bundled.js` first and last lines | `default` is `undefined` |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| E1 | defect | implemented | `file:packages/graph-layout-elkjs/tsup.config.ts`, `sym:defaultElkWorkerFactory` | ship `dist/elk-worker.min.js`; load it with `new URL('./elk-worker.min.js', import.meta.url)` — the `graph-layout-d3-force` precedent | correct unbundled; bundlers emit it as a worker asset. Vite dev still excludes the package from `optimizeDeps`, as for d3-force | worker URLs are bundler-sensitive | — |
| E2 | defect | implemented | `sym:ElkLayout.solve` | watch the worker's `error`; race each solve against it; on a dead worker, terminate it, switch to the bundled build and solve the same graph | a layout never hangs | a solve error is still rethrown, only a worker death falls back | — |
| E3 | defect | implemented | `sym:bundledElk` | accept `default.default` · `default` · `globalThis.ELK` | the fallback constructs | none | — |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `tsc --noEmit`, `pnpm build` | graph-layout-elkjs | clean; `dist/elk-worker.min.js` present | E1–E3 |
| V2 | pass | delete Studio's `?worker` factories ×4; pick Tree on the Explorer board; open the Modeller's all-models board and a plan | invana `studio/` | each lays out, no console errors | E1 |
| V3 | pending | a factory whose script 404s | story or Studio probe | the layout completes on the bundled build | E2, E3 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-20 | Opened from P0 of `rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story`; E1–E3 written | implemented | — |
| 2026-10-20 | Studio workarounds deleted; verified live in Studio | implemented | lands when merged to `main` |
