# `packages/canvas-core` — file and folder structure

A **new package**, extracted from `@invana/canvas`'s `src/core/` subtree once that subtree exists and is boundary-checked. **47 files, 5 folders.**

Its reason to exist: a rendering backend should depend on a small frozen package, not on the whole engine. Today `@invana/renderer-pixijs` peers on `@invana/canvas` and reaches 57 symbols across it. After this extraction that dependency is **gone** — every one of those symbols lives here.

---

## Structure

```
packages/canvas-core/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── CLAUDE.md
└── src/
    ├── index.ts                              the single public entry — no subpaths
    │
    ├── contracts/                            what a rendering backend implements
    │   ├── index.ts
    │   ├── IRenderer.ts                      lifecycle, surfaces, camera binding, capabilities
    │   ├── ISurface.ts                       a layer's slice + setBackdrop
    │   ├── IElementRenderer.ts               what a domain layer calls
    │   ├── IOverlayDevice.ts                 11 immediate-mode ops, transient only
    │   ├── ICameraBinding.ts                 the viewport the backend realises
    │   └── ICamera.ts                        narrow face of Camera that IRenderer needs
    │
    ├── geometry/                             spec in → path/point out. No display object.
    │   ├── connectors/
    │   │   ├── index.ts
    │   │   ├── pathSampling.ts
    │   │   ├── anchors/
    │   │   │   ├── boundary.ts
    │   │   │   ├── center.ts
    │   │   │   ├── edgePort.ts
    │   │   │   ├── perpendicular.ts
    │   │   │   └── silhouettePort.ts
    │   │   ├── pathStyles/
    │   │   │   ├── bezier.ts
    │   │   │   ├── bumpHorizontal.ts
    │   │   │   ├── bumpRadial.ts
    │   │   │   ├── bundle.ts
    │   │   │   ├── loopCurve.ts
    │   │   │   ├── loopPolyline.ts
    │   │   │   ├── normal.ts
    │   │   │   ├── quadratic.ts
    │   │   │   ├── rounded.ts
    │   │   │   ├── smooth.ts
    │   │   │   └── stepRadial.ts
    │   │   └── routers/
    │   │       ├── _aStar.ts
    │   │       ├── _obstacleGrid.ts
    │   │       ├── er.ts
    │   │       ├── manhattan.ts
    │   │       ├── metro.ts
    │   │       ├── oneSide.ts
    │   │       ├── orth.ts
    │   │       └── straight.ts
    │   └── badges/
    │       ├── index.ts
    │       ├── placement.ts
    │       ├── connectorPlacement.ts
    │       └── types.ts
    │
    ├── svg/                                  pure spec → markup
    │   ├── index.ts
    │   ├── shapeSpecToSvg.ts
    │   ├── connectorToSvg.ts
    │   └── pathToSvgD.ts
    │
    ├── animation/                            pure time
    │   ├── index.ts
    │   ├── Tween.ts
    │   └── easings.ts
    │
    └── headless/                             reference implementation of contracts/
        ├── HeadlessRenderer.ts
        └── HeadlessCameraBinding.ts
```

| Folder | Files | Holds |
|---|---|---|
| `contracts/` | 7 | the frozen surface a backend implements |
| `geometry/connectors/` | 26 | 6 routers · 11 path styles · 5 anchors · sampling |
| `geometry/badges/` | 4 | badge placement maths |
| `svg/` | 4 | spec → markup serialisers |
| `animation/` | 3 | `Tween`, easings |
| `headless/` | 2 | a complete working backend that draws nothing |
| — | 1 | `index.ts` |

---

## Where every file comes from

All 47 files are the `src/core/` subtree of `@invana/canvas`, moved wholesale. Nothing is written fresh at extraction time.

| Origin (pre-restructure) | Lands at |
|---|---|
| `canvas/src/renderer/{IRenderer,ISurface,IElementRenderer,IOverlayDevice}.ts` | `contracts/` |
| `canvas/src/camera/ICameraBinding.ts` | `contracts/` |
| *(new during the canvas restructure)* `ICamera.ts` | `contracts/` |
| `canvas/src/connectors/**` | `geometry/connectors/` |
| `canvas/src/badges/**` | `geometry/badges/` |
| `canvas/src/export/svgExport.ts` — the pure serialisers only | `svg/` |
| `canvas/src/animation/**` | `animation/` |
| `canvas/src/renderer/HeadlessRenderer.ts` | `headless/` |
| `canvas/src/camera/HeadlessCameraBinding.ts` | `headless/` |

---

## `package.json`

```jsonc
{
  "name": "@invana/canvas-core",
  "version": "0.0.11",              // same version as every in-repo package
  "type": "module",
  "exports": {
    ".": {                          // ONE entry. No subpaths — see the ./specs lesson
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "dependencies": {
    "@invana/canvas-store": "workspace:*"
  },
  "peerDependencies": {
    "typescript": ">=5.0.0"
  }
}
```

`@invana/canvas-store` is a normal `dependency`, not a peer — matching the precedent that the kernel below the engine is depended on directly, while cross-package engine deps are peers.

`tsup.config.ts`: `entry: ['src/index.ts']`, esm, dts, sourcemap, treeshake, `external: ['@invana/canvas-store']`.

---

## Layering after extraction

```
@invana/canvas-store          state · events · specs + shape geometry · picking · telemetry
      ▲                       zero @invana deps, no drawing library
      │
@invana/canvas-core           contracts · connector geometry · badges · svg · animation · headless
      ▲                  ▲    depends on canvas-store only
      │                  │
      │                  └─── @invana/renderer-pixijs      peers: canvas-core, canvas-store
      │                                                    owns pixi.js + pixi-viewport
      │                                                    NO @invana/canvas dependency
@invana/canvas                Canvas · registries · layers · behaviours · layouts · io
      ▲
      ├── @invana/graph
      ├── @invana/canvas-react
      └── graph-layout-* · graph-layer-*
```

**The payoff is checkable.** Today `@invana/renderer-pixijs` imports 138 symbols from `@invana/canvas`. Of those, 81 are `canvas-store` symbols reached through a re-export barrel and 2 are concrete engine classes (`Camera`, `Canvas`). Repoint the 81, remove the 2, and the remaining **55 are exactly the contents of this package** — 17 contracts, 30 geometry, 6 animation, 2 SVG. So after extraction:

```
grep -rn "@invana/canvas'" packages/renderer-pixijs/src    → 0 hits
```

That is the acceptance test for the whole split.

---

## Prerequisites

This package cannot be extracted until three things are true in `@invana/canvas`:

| # | Prerequisite | Why |
|---|---|---|
| 1 | `src/core/` exists as a contiguous subtree | Extraction is then a `git mv` plus a `package.json` |
| 2 | `IRenderer` takes `ICamera`, not the concrete `Camera` | `IRenderer.ts` currently type-imports the 465-line engine class. `HeadlessRenderer.ts` has the same leak, for the same reason — both resolve with one change |
| 3 | `core/` is dependency-checked against importing `engine/`, `layers/`, `behaviours/`, `layouts/`, `io/` | Without the gate the subtree drifts back into the engine and stops being liftable |

---

## Rules

| # | Rule |
|---|---|
| 1 | **Frozen surface.** Adding to `contracts/` is a promise every backend must keep — additive changes only, and say so in the changelog |
| 2 | Depends on `@invana/canvas-store` and nothing else. No drawing library, ever |
| 3 | Geometry is pure: a spec goes in, a path or a number comes out. No engine state, no display object, no `Canvas` |
| 4 | The reference implementation ships with the contract — `headless/` stays here, so anyone implementing `IRenderer` has a worked example and a way to test |
| 5 | One public entry (`.`). No subpath exports |
| 6 | Barrels for the package entry and for fan-outs of ≥3 sibling files |
