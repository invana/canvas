# Roadmap

## The why

**We are not a data visualization library. We are a high-performance data investigation
toolkit for your graphs.**

Visualization libraries render a snapshot and stop. Real understanding doesn't come
from looking at a picture — it comes from *investigating* the data: asking a
question, filtering, re-laying it out, annotating what you find, and watching the
view respond. Most graph tooling makes you leave the view to change the question.

Invana Canvas is a surface for **making decisions by interacting with your data**.
The picture is a means, not the product. Every visual is something you can
interrogate and change in place.

## The interaction loop

Four ways the user acts on data — all without leaving the canvas:

1. **Pull data via APIs** — grow the picture from a seed; expand neighbourhoods on demand.
2. **Tune the view live** — apply updates to filters, layouts, and behaviours as
   first-class editable state, not config you set once at init.
3. **Annotate to enrich** — add knowledge back onto the data (groups, notes, tags,
   relationships) to capture what you learn.
4. **Run analysis** — queries, short tasks, long-running tasks, and pipelines.

## Division of responsibility

Canvas is the interactive investigation front-end. **Modelling and analysis execution
live in the backend — [invana-backend](https://github.com/invana/invana)** (queries,
tasks, pipelines). Canvas drives and reflects them; it does not own them.

## Architecture

Package layering — engine at the base, domain on top, React/UI and apps above
(cross-package engine deps are `peerDependencies`):

```
                     apps/storybook   ·   apps/docs
                                  │
   ┌──────────────┬───────────────┼────────────────┬────────────────────┐
   │ canvas-react │   canvas-ui    │ canvas-designer│   graph-datasets    │
   │ (React bind) │   (editors)    │   (designer)   │     (samples)       │
   └──────┬───────┴───────┬────────┴───────┬────────┴─────────────────────┘
          │        graph-layout-*    graph-layer-*
          │        (force/elk/...)   (contour/bubble-sets/maplibre)
          └───────────────┴───────────────┘
                          ▼
                   @invana/graph        GraphCanvas · GraphLayer · GraphStore · behaviours
                          │ peer
                          ▼
                   @invana/canvas       Canvas · Layer/Behaviour/Layout · specs · picking ·
                          │              connector geometry · camera · IRenderer contract
                          │              (renderer-AGNOSTIC — imports no drawing library)
                          ▼ optional peer, resolved by lazy import()
            @invana/renderer-pixijs      the pixi backend: Application, viewport, shapes,
                                         connectors, decorations, textures, fonts
                                         (the only package that touches pixi.js / WebGPU)
```

Runtime model — one serialisable config is the source of truth; the renderer reads a
typed-array store for the hot, machine-rate data:

```
   editors / React hooks
        │  update(patch)                     get() / options:change ▲
        ▼                                                           │
   CanvasConfig ───────────▶ Canvas ──▶ registries: Layers · Behaviours · Layouts
   {layers,behaviours,                    │
    layouts,activeLayout}                 ├─ Camera (pixi-viewport)  ├─ EventBus
                                          └─ Renderer ◀── GraphStore / ColumnStore
                                                          (positions, streaming — typed arrays, ~10ns writes)
```

## Feature status

Legend: ✅ shipped · 🚧 in progress · 📋 planned

### Rendering & engine
| Capability | Status |
|---|---|
| WebGPU-first rendering, WebGL2 fallback | ✅ |
| Shapes — rect / circle / ellipse / polygon / composite, glyph + image fills | ✅ |
| Connectors — anchors / routers / path styles / markers | ✅ |
| Decorations (glow / halo / pulse / badge) & effects (shake / breathing / shimmer) | ✅ |
| Animations — viewport tweens, camera fly-to, easing | ✅ |
| Serialisable config as single source of truth (`get()` / `update()` / `options:change`) | ✅ |
| Typed-array `ColumnStore` + streaming feeds (frame-flush, batched events) | ✅ |
| Light / dark theming via external config patches | ✅ |
| **Pluggable renderer backend** — `@invana/canvas` is renderer-agnostic; the pixi backend lives in `@invana/renderer-pixijs` behind `IRenderer` / `ISurface` / `IElementRenderer` / `ICameraBinding`, resolved by lazy import as an optional peer. Enforced by `pnpm check-boundaries` | ✅ |
| **Headless backend** — `HeadlessRenderer` draws nothing and implements everything, so layouts, picking, bounds and projection are testable with no GPU or DOM | ✅ |
| Engine owns the only `requestAnimationFrame`; the backend presents when driven | ✅ |
| Picking engine-side from specs (rbush + per-kind `contains`), identical across backends | ✅ |
| Decorations & badges as spec state (still imperative commands today) | 🚧 |
| Geometry batching — one geometry per (kind, style) rather than one display object per element; the ceiling for 100k+ elements | 📋 |
| Second backend — `@invana/renderer-threejs` | 📋 |

### Layouts
| Layout | Package | Status |
|---|---|---|
| Force-directed (live sim) | `graph-layout-d3-force` | ✅ |
| Layered / tree / radial / stress / box / rect-packing | `graph-layout-elkjs` | ✅ |
| Tree / cluster / radial / pack / sunburst | `graph-layout-d3-hierarchy` | ✅ |
| Grid / snake / circular | `graph-layout-geometric` | ✅ |
| Sankey flow | `graph-layout-d3-sankey` | ✅ |
| Indented-tree · mind-map · fishbone | (on `OneShotPositionLayout`) | 📋 |

### Layers
| Layer | Status |
|---|---|
| Background · DevInfo · LayersPanel | ✅ |
| GraphLayer · MiniMapLayer · GraphLegendLayer | ✅ |
| Density contour (fill + stroke) | ✅ |
| Bubble-sets (group annotation) | ✅ |
| MapLibre basemap | ✅ |

### Interactions (behaviours)
| Behaviour | Status |
|---|---|
| Camera — drag-pan, wheel-zoom, pinch-zoom, keyboard | ✅ |
| Select — click, lasso, brush | ✅ |
| Hover activate + neighbourhood highlight | ✅ |
| Drag node, node resize, draw edge, create node | ✅ |
| Context menu, collapse / expand, colour-by-label | ✅ |
| Hover preview card | ✅ |
| Level-of-detail (node / edge size, label resolution) | ✅ |

### React & apps
| Surface | Status |
|---|---|
| Declarative `<Canvas>` + child wrappers | ✅ |
| Hooks — camera / zoom / fit / events, `useGraphCanvasUpdate` / `useGraphCanvasOptions` | ✅ |
| Components + assembled toolbars | ✅ |
| `GraphCanvasApp` compound app | ✅ |

### Editors & template authoring
| Feature | Status |
|---|---|
| Node style / styling / structure / hover-card editors (`canvas-ui`) | ✅ |
| Node template designer — surface 1 of `canvas-designer` | ✅ |
| An editor for **every** behaviour / layer / layout | 📋 |
| Edge template designer | 📋 |
| Whole-canvas designer shell — scene tree + inspector (`canvas-designer`) | 📋 |

### State, observability & collaboration
| Feature | Status |
|---|---|
| Serialisable config + live `update()` + `options:change` events | ✅ |
| `options` → `state` vocabulary rename | 📋 |
| OpenTelemetry over state mutations | 📋 |
| Real-time collaboration (CRDT doc + ephemeral presence) | 📋 |
| Offline + multi-user (Postgres + Redis sync) | 📋 |

## What's next

Behaviours, layers, and layouts are configured today through one serialisable config
(`canvas.update()` / `canvas.get()` / `options:change`). To make data genuinely
*interactive*, that state needs to be **editable from the UI**:

1. **An editor for every behaviour / layer / layout** in `@invana/canvas-ui`, following
   the `fields.ts` + `mapping.ts` + `<Editor>` pattern the node editors already establish,
   applied via `useGraphCanvasUpdate().update(...)`.
2. **OpenTelemetry** over those mutations — every edit becomes a traced, named action.
3. **Real-time + offline collaboration** — a CRDT document (config / templates /
   annotations) synced FE↔backend, with ephemeral presence (cursors, idle/away) — so the
   frontend and `invana-backend` share the exact state of a user's analysis.

Detail in [`docs/collaborative-state-plan.md`](./docs/collaborative-state-plan.md).

## Design notes & plans

Detailed design rationale and implementation plans live in [`docs/`](./docs/) (internal,
not the published docs site). See [`docs/README.md`](./docs/README.md) for the index —
architecture proposal, data model, state/options, collaboration, and per-feature plans.
