# Canvas Store — State Inventory & Type Map

> **Status: DESIGN / WORKING REFERENCE.** A complete census of **every piece of
> state** the engine manages today — across canvas settings, layers, behaviours,
> layouts, styling, templates, theme, and per-element records — with each item's
> **type definition**, its **physics class**, its **source of truth today**, and
> its **target home** in `@invana/canvas-store`. The purpose is the mapping:
> "given everything that helps rendering, what does the kernel store, where, and
> how." Companion to [`canvas-state-plan.md`](./canvas-state-plan.md) (the design
> rationale) and [`canvas-store-data-event-flow.md`](./canvas-store-data-event-flow.md)
> (the flow + as-built status). Compiled from a full read of the active packages.
>
> Type blocks are **condensed from the authoritative TSDoc'd source** (pointer
> given per block) — field names + types are faithful; long doc comments are
> dropped. Don't treat this as the canonical declaration (those rot); treat it as
> the mapping worksheet. Proposed kernel types (`§2`, marked **NEW**) are the only
> ones authored here.

## Contents

1. Physics classes (the five lanes) · 2. Target `CanvasStore` shape (proposed) ·
3. `view.definition` · 4. `view.interaction` · 5. `view.runtime` (new) ·
6. `data` · 7. Derived (not stored) · 8. Config catalogs (layouts · behaviours · layers) ·
9. Type appendix (records · styles · shapes · templates · theme) ·
10. Source → target mapping · 11. Cross-cutting decisions

---

## 1. Physics classes (the five lanes)

Every field is tagged with one. The class — not the field's "category" — decides
which store lane it lives in.

| Class | Meaning | Store lane | Rate |
|---|---|---|---|
| **DEFINITION** | authored config — "what the visualisation IS" | `view.definition` (reactive, immer, **synced → CRDT doc**) | human |
| **INTERACTION** | ephemeral live view — selection/hover/camera/gesture | `view.interaction` (reactive, **ephemeral → Awareness**) | high |
| **RUNTIME-OBS** | small transient state a UI observes (layout running, message) | `view.runtime` (reactive, ephemeral, **not synced**) | low |
| **DATA-COLD** | per-element records — payload, per-element style/state overrides, type, parentId | `data[id].records` (reactive-ish, human-rate) | human |
| **DATA-HOT** | machine-rate per-element columns — `x`,`y`, flags/pinned | `data[id]` typed-array, **never reactive**, frame-flush | machine |
| **DERIVED** | computed from the above — never stored | recomputed in the renderer projection | — |
| **HANDLE** | live runtime object (pixi/DOM/worker/store ref) — **not state** | renderer-adapter-private, never in the kernel | — |

---

## 2. Target `CanvasStore` shape (proposed) — **NEW**

The kernel types we are designing. Everything in §3–§7 maps into this. Marked
**NEW** because, unlike the rest of the doc, these are authored here, not
transcribed from source. Reflects the refinements from §11 (two-lane `data`,
`canvas` scene slice, `runtime` slice, presence in `interaction`, first-class
`groups`, `query` stream status).

```ts
interface CanvasStore {
  view:   ReactiveStore<CanvasView>;        // reactive · small · human-rate
  data:   Record<string, DataSource>;       // keyed by SOURCE id (many layers → one source)
  events: CanvasEventBus;                    // bus + tap (already built)
}

interface CanvasView {
  definition: {                              // DEFINITION — synced (CRDT doc)
    canvas:       CanvasSceneOptions;        // NEW slice — scene-level config (§3.1)
    layers:       Record<string, LayerOptions>;       // keyed by instance id; carries dataSourceId
    behaviours:   Record<string, BehaviourOptions>;
    layouts:      Record<string, LayoutOptions>;
    activeLayout: string | null;
    templates:    TemplateRegistries;        // structures + stylings + nodeTypes (§3.5)
    styling:      StylingDefaults;           // per-layer node/edge defaults + state catalogue + rules (§3.6)
    theme:        ThemeConfig;               // { registry, active, mode, accent } (§3.7)
  };
  interaction: {                             // INTERACTION — ephemeral (Awareness)
    selection:    ReadonlySet<string>;       // semantic chosen set (D11)
    hover:        string | null;
    states:       Record<string, ReadonlySet<string>>;   // presence overlay: stateName → ids
    camera:       { x: number; y: number; zoom: number };
    focus:        { ids: ReadonlySet<string>; dim: boolean } | null;  // highlight-neighbourhood (O(1))
    transientPins: ReadonlySet<string>;      // drag/resize gesture locks — NOT data.pinned
    viewMode:     string;                    // 'select' | 'draw' | 'annotate' | …
  };
  runtime: {                                 // RUNTIME-OBS — ephemeral, NOT synced (§5)
    layout:  { running: boolean; activeId: string | null; animate: boolean; progress?: number };
    message: string | null;
  };
}

interface DataSource {                       // one per source id (graph / table / geo …)
  // DATA-HOT — typed-array columns (ColumnStore), frame-flushed, never reactive:
  //   x: Float32Array, y: Float32Array, flags: Uint8Array (pinned/disabled bits), slot maps
  // DATA-COLD — per-element records (reactive-ish), human-rate:
  records:     Record<string, NodeRecord | EdgeRecord>;   // id, type, data, parentId, states[], style, state
  groups:      Record<string, GroupRecord>;               // many-to-many: memberIds[], edges[], style, label, geometry(DERIVED)
  annotations: Record<string, AnnotationRecord>;
  query:       { refs: QueryRef[]; intents: IntentLogEntry[]; status: 'idle'|'loading'|'streaming'|'error' };
}
```

> The kernel's current [`LayerData`](../packages/canvas-store/src/data/LayerData.ts)
> is the cold lane only (plain `Map`s); the real
> [`GraphStore`](../packages/graph/src/store/GraphStore.ts) already has the hot
> `ColumnStore` lane + adjacency indexes + pending-edge buffer. The target
> `DataSource` unifies both lanes behind one source id (§11.2).

---

## 3. `view.definition` — authored, persisted, synced

### 3.1 Canvas scene options — **NEW slice, no home today**

Today these are scattered across `CanvasOptions` (renderer-init), `Camera`
(zoom limits), and a `BackgroundLayer` (grid). The kernel needs a scene-level
DEFINITION slice. Source: [`Canvas.ts:50`](../packages/canvas/src/engine/Canvas.ts), [`Camera.ts:45`](../packages/canvas/src/camera/Camera.ts).

```ts
// CanvasOptions (engine ctor) — packages/canvas/src/engine/Canvas.ts
interface CanvasOptions {
  id?: string;                                          // DEFINITION
  container?: HTMLElement;                              // HANDLE (DOM mount)
  preference?: 'webgpu' | 'webgl' | 'canvas';          // renderer-init → ADAPTER, not synced doc
  width?: number; height?: number;                     // DEFINITION (or DERIVED from container)
  resolution?: number;                                 // renderer-init → ADAPTER
  antialias?: boolean;                                 // renderer-init → ADAPTER
  opaque?: boolean;                                    // renderer-init → ADAPTER
  backgroundColor?: number;                            // DEFINITION (scene)
  powerPreference?: 'high-performance' | 'low-power';  // renderer-init → ADAPTER
  hello?: boolean;                                     // renderer-init → ADAPTER
  autoResize?: boolean;                                // HANDLE/DOM concern
  suppressBrowserContextMenu?: boolean;                // DEFINITION (scene)
  config?: CanvasConfig;                               // = the definition compartment below
}

// CanvasConfig (the serialisable visual config) — engine/CanvasConfig.ts
interface CanvasConfig {
  layers?: Record<string, Record<string, unknown>>;       // DEFINITION → view.definition.layers
  behaviours?: Record<string, Record<string, unknown>>;   // DEFINITION → view.definition.behaviours
  layouts?: Record<string, Record<string, unknown>>;      // DEFINITION → view.definition.layouts
  activeLayout?: string;                                   // DEFINITION → view.definition.activeLayout
}

// Camera (zoom/pan config) — packages/canvas/src/camera/Camera.ts
interface CameraOptions {
  viewport: Viewport;                                  // HANDLE
  screenWidth: number; screenHeight: number;           // DERIVED (mirrors viewport size)
  bus?: CanvasEventBus;                                // HANDLE
  initialScale?: number; initialX?: number; initialY?: number;  // DEFINITION (scene) — initial camera
  minScale?: number; maxScale?: number;                // DEFINITION (scene) — zoom limits  [default .01..100]
}
```

**Proposed `CanvasSceneOptions` (NEW):** `{ backgroundColor?, suppressBrowserContextMenu?, zoom: { min, max }, initialCamera?: {x,y,zoom}, worldBounds?, defaultViewMode? }`. Renderer-init fields (`preference`/`antialias`/`resolution`/`powerPreference`/`opaque`/`hello`) go to the **renderer adapter config**, not the synced doc. Background grid stays a `BackgroundLayer` (it's a layer, see §8).

### 3.2 Layer options — `view.definition.layers[id]`

Base, shared by every layer. Source: [`Layer.ts:59`](../packages/canvas/src/layers/Layer.ts).

```ts
interface LayerOptions<TOptions = unknown> {
  id: string;               // DEFINITION
  options: TOptions;        // DEFINITION — subclass-specific bag (see §8 catalog)
  visible?: boolean;        // INTERACTION (toggled live; also a default)
  hittable?: boolean;       // DEFINITION
  zIndex?: number;          // DEFINITION
  cullable?: boolean;       // DEFINITION
  devtoolsName?: string;    // HANDLE (devtools label)
}
```

Per-layer subclass option bags (Background, DevInfo, MiniMap, contour, bubble-sets, map, GraphLayer) → §8. **`GraphLayer` adds a `dataSourceId` pointer** (today it owns its `store`; the kernel inverts this — the layer references `data[sourceId]`, §11.5).

### 3.3 Behaviour options — `view.definition.behaviours[id]`

Base. Source: [`Behaviour.ts:37`](../packages/canvas/src/behaviours/Behaviour.ts).

```ts
interface BehaviourOptions {
  id: string;                       // DEFINITION
  targetLayerId?: string;           // DEFINITION (cross-layer ref; absent ⇒ canvas-scoped)
  enabled?: boolean;                // INTERACTION (toggled live; default false — rule 7)
  shortcuts?: readonly string[];    // DEFINITION
}
```

Per-behaviour option bags (≈20 behaviours) → §8.2. **Note:** many carry
function-valued options (`filter`, `createNode`, `onSelect`, accessors) — see §11.4.

### 3.4 Layout options — `view.definition.layouts[id]`

Base + the one-shot mixin. Source: [`Layout.ts:76`](../packages/canvas/src/layouts/Layout.ts), [`OneShotPositionLayout.ts`](../packages/graph/src/layout/OneShotPositionLayout.ts).

```ts
interface LayoutOptions {            // every layout
  id?: string;                       // DEFINITION
  targetLayerId?: string;            // DEFINITION
}
interface OneShotLayoutOptions extends LayoutOptions {   // elk / hierarchy / geometric
  transition?: boolean | number;     // DEFINITION (glide vs snap)
  transitionEase?: EasingName;       // DEFINITION
}
```

Per-layout config (the tunables) → §8.1. **Layout run state is NOT here** — it's
RUNTIME-OBS (§5). Several layout config fields are function-valued (§11.4).

### 3.5 Templates — `view.definition.templates`

Authored skeletons + styling + bindings. Full types in §9.4. Source: [`template/types.ts`](../packages/graph/src/template/types.ts).

```ts
interface TemplateRegistries {                       // DEFINITION
  structures: Record<string, NodeStructureTemplate>; // SimpleStructure | CardStructure | FreeformStructure
  stylings:   Record<string, NodeStylingTemplate>;   // roles + typography (no hex)
  nodeTypes:  Record<string, NodeTypeBinding>;       // type → structure + styling + slot bindings
}
```

`FreeformStructure` is the **designer's output** (absolute-positioned `elements[]`). The hover **preview-card** spec (`HoverElementPreviewCardSpec`) is also an authored template (§9.4).

### 3.6 Styling defaults & rules — `view.definition.styling`

Per-layer node/edge defaults, the state-style **catalogue**, and **data-driven rules**. The big types (`NodeStyle`/`EdgeStyle`) are in §9.2. Source: [`layer/types.ts`](../packages/graph/src/layer/types.ts).

```ts
interface StylingDefaults {                  // DEFINITION (per layer id)
  node:  NodeOption;   // { type?, style: ResolvableNodeStyle, state: Record<name, ResolvableNodeStyle> }
  edge:  EdgeOption;   // sibling for edges
  stateCatalogue: { node: Record<string, NodeStyle>; edge: Record<string, EdgeStyle> };  // DEFAULT_*_STATES + overrides
  rules: {                                   // data-driven styling RULES (not the applied colours — those are DERIVED)
    colorByLabel?: { palette: number[]; nodeLabel; edgeLabel; colorNodes; colorEdges; fallbackColor };  // §11.3
    degreeSize?:   { direction; minSize; maxSize; scale; sizeFn };
  };
}
```

> **Per-element style overrides** (a hand-recoloured node) are **DATA-COLD**, not
> here — they live on the record (`NodeRecord.style`), §6. This slice is only the
> *layer-wide* defaults + rules. The applied result (merged effective style,
> label→colour map) is **DERIVED** (§7).

### 3.7 Theme — `view.definition.theme`

Authored theme config. The resolved palette is DERIVED (§7). Full types §9.5. Source: [`theme/types.ts`](../packages/graph/src/theme/types.ts), `ThemeBehaviour`.

```ts
interface ThemeConfig {                       // DEFINITION
  registry: Record<string, Theme>;            // named families, each { light, dark }: ThemePalette
  active:   string;                           // active family name
  mode:     'system' | 'light' | 'dark';
  accent?:  'css-var' | number;
  accentVar?: string;
}
```

---

## 4. `view.interaction` — ephemeral live view

Today this is **scattered across behaviour instances** (each holds its own
selection/hover/drag maps) plus `GraphStore`'s presence sets. The kernel
consolidates the **shared semantic** state here; **gesture-local** transients
(lasso path mid-drag, brush rect, drag offsets) stay behaviour/overlay-local (§11.7).

| Field | Type | Source today | Notes |
|---|---|---|---|
| `selection` | `Set<id>` | `ClickSelectBehaviour.seeds` / `.selected` | semantic chosen set (D11); lineage expansion is derived |
| `hover` | `id \| null` | `HoverActivateBehaviour.current` | ≤1 per layer |
| `states` | `Record<name, Set<id>>` | `GraphStore.nodeRuntimeStates` / `edgeRuntimeStates` | presence overlay: hovered/selected/highlighted/dimmed |
| `camera` | `{ x, y, zoom }` | `Camera.viewport` (pixi handle) | abstract transform; ⚠ MapLayer inverts ownership (§11.8) |
| `focus` | `{ ids, dim } \| null` | (none — new) | highlight-neighbourhood: O(1) set + mode, not per-element writes |
| `transientPins` | `Set<id>` | `DragNode`/`NodeResize` drag state | gesture lock; **distinct from data `pinned`** (§11.6) |
| `viewMode` | `string` | (engine-level) | select / draw / annotate |

**Gesture-local (stays in the behaviour, NOT the store):** `LassoSelectBehaviour.worldPoints` (the live path), `BrushSelectBehaviour.dragStart/dragCurrent` (rect corners), `DragNodeBehaviour.state` (grab offsets), `DrawEdgeBehaviour.sourceId/candidateTarget` (draft), `ContextMenu`/`ClickInspect` open target, `LabelCollisionBehaviour.lastVisible` (flicker guard). These are INTERACTION in spirit but ephemeral-to-the-gesture and never shared/synced.

---

## 5. `view.runtime` — **NEW slice** (observable transient)

Small transient state a UI must *observe* but which is neither authored nor
per-user-synced. Today surfaced only via events, with **no observable field**.

| Field | Type | Source today | Notes |
|---|---|---|---|
| `layout.running` | `boolean` | every layout's `running` flag + `Layout.events` `start`/`end` | the universal "is a layout running" — needed for spinners/stop |
| `layout.activeId` | `string \| null` | `activeLayout` + run lifecycle | which layout is executing |
| `layout.animate` | `boolean` | `D3ForceLayout.animate` / `start` event payload | live-tick vs one-shot settle |
| `layout.progress?` | `number` | `d3 sim.alpha()` (force only) | only force has intra-run progress; others are binary |
| `message` | `string \| null` | `Canvas._currentMessage` (+ `message` event) | transient overlay/status channel |

Decision (§11): own slice vs fold into `interaction`. Recommended: own `runtime` slice — it's not per-user view state and must not sync.

---

## 6. `data[sourceId]` — bulk records (two lanes)

The per-element data. **Two physics in one source** (§11.2): hot typed-array
columns + cold records. Full record types in §9.1. Source: [`store/types.ts`](../packages/graph/src/store/types.ts), graph `CLAUDE.md`.

```ts
// NodeRecord (= GraphNode) — packages/graph/src/store/types.ts
interface GraphNode<D = unknown> {
  id: string;                              // DATA-COLD
  type?: string;                           // DATA-COLD (matches a NodeOption template)
  data?: D;                                // DATA-COLD (opaque payload)
  parentId?: string;                       // DATA-COLD (single hierarchy field: tree + group membership)
  position?: { x: number; y: number };     // DATA-HOT (typed-array columns; mutated by layouts/drags)
  pinned?: boolean;                        // DATA-HOT (flag bit; layout-exclusion)
  states?: readonly string[] | null;      // DATA-COLD (document active-state list, e.g. 'disabled')
  style?: NodeStyle;                       // DATA-COLD (per-element concrete override)
  state?: Record<string, NodeStyle>;       // DATA-COLD (per-element overlay catalogue)
}

interface GraphEdge<D = unknown> {
  id: string; source: string; target: string;  // id/source/target DATA-COLD (slot maps are DATA-HOT)
  type?: string; data?: D;                      // DATA-COLD
  states?: readonly string[] | null;            // DATA-COLD
  style?: EdgeStyle; state?: Record<string, EdgeStyle>;  // DATA-COLD
}
```

**Groups — first-class, many-to-many (NEW unification, §11.6).** Today two
divergent models: graph treats a group as a `GraphNode` + `style.group:
GroupOptions` + `parentId` children; bubble-sets holds a layer-private `BubbleSet
{ id, members[], edges[], style, label }`. Target:

```ts
interface GroupRecord {
  id: string;
  memberIds: string[];        // DATA-COLD — many-to-many (a node can be in several)
  edges?: string[];           // DATA-COLD — optional incident edges to enclose (bubble-sets)
  style?: GroupStyle;         // DEFINITION — fill/stroke/label (lives in definition, keyed by group id)
  geometry?: GroupGeometry;   // DERIVED — hull/rect/contour, throttled for bubble-sets (never reactive)
}
```

`GroupOptions` (the frame-on-a-node variant) full type in §9.3.

**Annotations:** `{ id, kind, … }` — DATA-COLD (open).

**Query / stream status (in plan §3, NOT in code yet):**

```ts
query: {
  refs:    QueryRef[];            // DEFINITION-ish — saved query references
  intents: IntentLogEntry[];     // audit/collab trail ("addNode dave", "ran query Q")
  status:  'idle' | 'loading' | 'streaming' | 'error';   // RUNTIME-OBS — the streaming lifecycle
}
```

`GraphStoreOptions` (ingestion behaviour, DEFINITION): `flushMode: 'sync'|'frame'`, `unknownEndpoint: 'throw'|'buffer'|'drop'`, `pendingEdgeTTL`, `initialCapacity`, `id`.

---

## 7. Derived — computed, never stored

Recomputed in the renderer projection (pure functions of definition + interaction + data + theme). Storing them is the anti-pattern.

| Derived value | Computed from | Notes |
|---|---|---|
| effective merged `NodeStyle`/`EdgeStyle` | layer `node.style` → per-element `style` → active `state[name]` overlays | the `resolveNodeStyle` `Object.assign` chain (graph `CLAUDE.md`) |
| compiled composite shape | `FreeformStructure`/`CardStructure` + node data + `RolePalette` | `compileFreeform`/`compileCard` → `CompositeShapeOption` |
| resolved `RolePalette` | `ThemeConfig` + mode | `ThemeBehaviour` publishes on `theme:change` |
| label → colour map | `ColorByLabelBehaviour` rule + first-appearance order | the *rule* is DEFINITION; the *map* is derived/cached |
| group / contour geometry | member positions | throttled (bubble-sets O(members×grid)); §11.6 |
| visible bounds, FPS, LOD tier | camera + viewport | renderer-local |
| adjacency indexes, children index | edges / `parentId` | `GraphStore` maintains internally |

---

## 8. Config catalogs (the per-instance option bags)

Faithful field lists from the survey. These are all **DEFINITION** unless tagged.
Function-valued fields marked ✦ (don't serialise — §11.4).

### 8.1 Layouts — config union (per-layout)

| Layout | Distinguishing config (all DEFINITION) |
|---|---|
| **D3Force** | `animate`, `reheatAlpha`, `workerFactory`✦, `alpha`, `alphaMin`, `alphaDecay`, `alphaTarget`, `velocityDecay`, `link{distance,strength,iterations}`, `charge{strength,theta,distanceMin,distanceMax}`, `center{x,y,strength}`, `collide{radius✦,strength,iterations}`, `x{x,strength}`, `y{y,strength}`, `radial{radius,x,y,strength}` |
| **Elk** | `algorithm`, `direction`, `nodeSpacing`, `layerSpacing`, `edgeNodeSpacing`, `edgeSpacing`, `edgeRouting`, `padding`, `defaultNodeSize`, `nodeSize`✦, `layoutOptions`, `workerFactory`✦ |
| **D3Hierarchy** | `mode` (tree/cluster/radial-*/pack/sunburst), `rootId`, `size`, `nodeSize`, `radius`, `orientation`, `separation`✦, `center`, `padding`, `value`✦, `sort`✦ |
| **D3Sankey** | `size`, `nodeWidth`, `nodePadding`, `iterations`, `nodeAlign`, `nodeSort`✦, `linkSort`✦, `center` *(no `transition`)* |
| **Geometric** | `mode` (grid/snake/circular), `columns`, `columnGap`, `rowGap`, `radius`, `nodeSpacing`, `startAngle`, `clockwise`, `center` |

Layout **DERIVED writeback** (into data, §11.3): Elk → edge `waypoints` + `pathType:'orth'`; Hierarchy pack → node `shape:{circle}`, sunburst → `shape:{arc}`; Sankey → node `shape:{rect}` + edge `strokeWidth` + `edge-port` anchors.

### 8.2 Behaviours — option catalog (≈20)

All carry base `BehaviourOptions`. Listed: distinguishing options (DEFINITION) +
the **INTERACTION** state each holds today.

| Behaviour | Options (DEFINITION) | Holds (INTERACTION) |
|---|---|---|
| HoverActivate | `enable, state, inactiveState, raiseActive, degree, direction, zoomThreshold, zoomedOutState, zoomedOutEdgeState, zoomedOutScale, onHover✦, onHoverEnd✦` | `current` (hovered), `activeIds/inactiveIds/raisedIds` |
| HoverElementPreview | `targets, openDelay, closeDelay, placement, interactive, enable, card, cards, onShow✦, onHide✦` | `shown/pending` (card target), `held` |
| ClickSelect | `enable, multiple, trigger, degree, direction, state, unselectedState, raiseActive, clearOnBackground, onSelect✦, onDeselect✦, onSelectionChange✦` | `seeds`, `selected` (+lineage), `unselectedIds/raisedIds` |
| ClickInspect / ClickView | `clearOnBackground` | `target` |
| LassoSelect | `clickSelectId, enable, enableElements, trigger, immediately, state, style, clearOnBackground, onSelect✦` | `worldPoints` (lasso path — gesture-local) |
| BrushSelect | (same as Lasso) | `dragStart/dragCurrent` (rect — gesture-local) |
| DragNode | `filter✦, dragCursor, pinOnRelease, groupAware, dragSelection, selectionState, selectionBodyDrag, selectionBodyPadding` | `state` (drag — gesture-local), transient pin |
| ContextMenu | `targets, state, onContextMenu✦` | `statedTarget` |
| CreateNode | `createNode✦, onNodeCreate✦` | pointer-down discriminators |
| DrawEdge | `allowSelfLoop, createEdge✦, onEdgeCreate✦, draftStyle` | `sourceId`, `candidateTarget` (gesture-local) |
| Erase | `target, onErase✦` | — |
| NodeResize | `handleRadius, handleFill, frameColor, dashArray, framePadding, minSize` | `state` (resize — gesture-local) |
| CollapseExpand | — | (toggles `group.collapsed` in data) |
| ParallelEdge | `spacing, basis, anchorOffset, groupBy✦, distribute` | writes edge `waypoints` (DERIVED→data) |
| **ColorByLabel** | `palette, nodeLabel✦, edgeLabel✦, colorNodes, colorEdges, fallbackColor` | label→colour map (DERIVED); installs a resolver on the template |
| DegreeSize | `direction, minSize, maxSize, scale, sizeFn✦` | `prior` size map (DERIVED→data, with restore shadow) |
| **Theme** | `themes, active, fallback, mode, accent, accentVar, light, dark` | publishes resolved palette (DERIVED) |
| NodeSizeLOD / EdgeSizeLOD | `layers[]` (tier configs) | resolved tiers (DERIVED) |
| LabelResolutionLOD | `baseResolution, levels, hysteresis` | current tier idx (DERIVED) |
| LabelCollision | `strategy, prioritise, flickerGuardMs, groups` | `lastVisible/lastFlip` (gesture-local) |
| DragPan / WheelZoom / PinchZoom / KeyboardCamera | `modifier, mouseButtons, decelerate, dragCursor` / `requireCtrl, percent, smooth` / `noDrag, percent` / `panStep, zoomFactor, keymap` | (camera writes) |

### 8.3 Layers — option catalog

| Layer | Options (DEFINITION) | Pkg |
|---|---|---|
| **GraphLayer** | `store`HANDLE, `initData`DATA, `node`/`edge` (NodeOption/EdgeOption), `useDefaultStates`, `hitFloorPx`, `nodeStructureTemplates`, `nodeStylingTemplates`, `nodeTypes` | graph |
| MiniMap | `graphLayerId`, `width`, `height`, `backgroundLayerId`, colors, `borderWidth`, `padding`, `enableDrag`, `position`, `mode`, `margin` | graph |
| Background | `type`, `patternType`, `color`, `backgroundColor`, `size`, `spacing`, `alpha`, `followCamera`, `mode`, `surfaceRole`, `patternRole` | canvas |
| DevInfo | `corner`, `margin`, `enabled`, `fontSize`, `opacity`, colors | canvas |
| LayersPanel | `corner`, `enabled`, `fontSize`, `opacity`, colors, `hideIds` | canvas |
| DensityContour (Fill/Stroke) | `graphLayerId`, `bandwidth`, `thresholds`, `cellSize`, `padding`, `recompute`, `recomputeDebounceMs` + palette (`fillColor✦/fillOpacity/palette` or `strokeColor/strokeWidth✦/indexEvery…`) | graph-layer-d3-contour |
| BubbleSets | `graphLayerId`, `sets[]` (groups), `pixelGroup`, `nodeR0/R1`, `edgeR0/R1`, `morphBuffer`, `maxRouting/MarchingIterations`, `smoothness`, `chaikinIterations`, `recompute`, `recomputeDebounceMs` | graph-layer-bubble-sets |
| Map | `styleUrl`, `center`, `zoom`, `minZoom`, `maxZoom`, `mountTarget`HANDLE, `passInputToMap` | graph-layer-maplibre |

---

## 9. Type appendix (the rendering data model)

Condensed from authoritative source. The "data that helps rendering."

### 9.1 Records — `GraphNode` / `GraphEdge`

→ shown in §6. Source [`store/types.ts`](../packages/graph/src/store/types.ts); input-side resolver variants (`NodeInput`/`EdgeInput`) and stored variants (`NodeData`/`EdgeData`) in [`layer/types.ts`](../packages/graph/src/layer/types.ts).

### 9.2 Styles — `NodeStyle` / `EdgeStyle` (DEFINITION default / DATA-COLD override)

Flat-prefixed scalars; polymorphic values structured. Source [`layer/types.ts:875`](../packages/graph/src/layer/types.ts).

```ts
interface NodeStyle {
  // structural
  shape?: NodeShapeOptions; size?: number; group?: GroupOptions; resizable?: boolean;
  // background paint
  bgFill?: ShapeFill; bgAlpha?; bgStrokeColor?; bgStrokeAlpha?; bgStrokeWidth?;
  bgStrokeAlignment?: 'inside'|'center'|'outside'; bgStrokeDashArray?: [number,number];
  bgStrokeDashOffset?; bgStrokeCap?: 'butt'|'round'|'square'; bgStrokeJoin?: 'miter'|'round'|'bevel';
  // insets
  icon?: NodeIcon; image?: NodeImage;
  // label (text/font)
  labelText?; labelColor?; labelFontSize?; labelFontFamily?; labelFontWeight?: number|string;
  labelFontStyle?: 'normal'|'italic'; labelAlign?: 'left'|'center'|'right'; labelLineHeight?;
  labelLetterSpacing?; labelPlacement?: ShapeLabelPlacement; labelOffsetX?; labelOffsetY?;
  labelAlpha?; labelMinFontSize?; labelRotation?;
  // label LOD / collision
  labelMinZoom?; labelMaxZoom?; labelPriority?; labelCollisionGroup?; labelForceShow?: boolean;
  // label background pill
  labelBackgroundFill?; labelBackgroundAlpha?; labelBackgroundStrokeColor?;
  labelBackgroundStrokeWidth?; labelBackgroundPadding?; labelBackgroundCornerRadius?;
  labelStyle?: ShapeLabelStyle;   // escape hatch (overrides flat label fields)
  // composites
  badges?: NodeBadge[]; decorations?: NodeDecorationSpec[]; effects?: NodeEffects;
}

interface EdgeStyle {
  shape?: EdgeShapeOptions;
  strokeColor?; strokeAlpha?; strokeWidth?; strokeAlignment?; strokeDashArray?: [number,number];
  strokeDashOffset?; strokeCap?; strokeJoin?;
  arrowSourceShape?: ArrowShape; arrowSourceSize?; arrowSourceColor?; arrowSourceAlpha?;
  arrowTargetShape?: ArrowShape; arrowTargetSize?; arrowTargetColor?; arrowTargetAlpha?;
  // label block — mirrors NodeStyle + labelPathOffset, labelAutoRotate, labelKeepUpright
  labelStyle?: ConnectorLabelStyle;
  decorations?: EdgeDecorationSpec[]; badges?: EdgeBadge[];
}

// resolver-aware mirrors used on layer templates / inputs:
type ResolvableNodeStyle<D> = { [K in keyof NodeStyle]?: NodeStyle[K] | ((d: D) => NodeStyle[K]) };  // ✦ §11.4
```

State-style defaults baked in: `DEFAULT_NODE_STATES` / `DEFAULT_EDGE_STATES` for `hovered/selected/highlighted/dimmed/disabled` (auto-merged unless `useDefaultStates:false`).

### 9.3 Shapes / insets / badges / decorations / groups

Source [`layer/types.ts`](../packages/graph/src/layer/types.ts).

```ts
type NodeShapeOptions =                       // discriminated by `kind`
  | { kind:'rect'; width; height; cornerRadius? }
  | { kind:'circle'; radius }
  | { kind:'arc'; innerR; outerR; startAngle; endAngle }
  | { kind:'regular-polygon'; sides; radius; rotation? }
  | { kind:'star'; points; innerRadius; outerRadius; rotation? }
  | { kind:'polygon'; vertices: Point[] }
  | { kind:'composite'; width; height; cornerRadius?; root?: CompositeRootSpec; fill?; fillAlpha?; stroke?; parts: CompositePart[] }
  | { kind: string };                         // custom (runtime-registered)

type EdgePathType = 'straight'|'bezier'|'quadratic'|'bump-radial'|'bump-horizontal'
  |'step-radial'|'orth'|'manhattan'|'rounded'|'smooth'|'bundle'|'loop-curve'|'loop-polyline';
type EdgeAnchor = 'boundary'|'center'|'perpendicular'|'edge-port'|string;
interface EdgeShapeOptions { pathType?; sourceAnchor?; targetAnchor?; sourceAnchorOpts?; targetAnchorOpts?; pathStyleOpts?; waypoints?: {x;y}[] }

type NodeIcon = { kind:'glyph'; char; … } | { kind:'svg'; pathD; … } | { kind:'svg-url'; url; … };
interface NodeImage { url; alpha?; fit?: 'cover'|'contain'; padding? }
interface NodeBadge { id?; placement: BadgePlacement; origin?; shape: NodeShapeOptions; fill?; … icon?; labelText?; offsetX?; offsetY?; zIndex?; decorations?; effects? }
interface EdgeBadge { id?; placement: 'start'|'middle'|'end'|number; … pathOffset?; autoRotate?; keepUpright? }
type NodeDecorationSpec = {kind:'ring'|'glow'|'pulse-ring'|'marching-ants'|'liquid-fill'|'toggle'|'resize-handle'|'selection-frame'} & style;
type EdgeDecorationSpec = {kind:'ring-connector'|'glow-connector'|'marching-ants-connector'|'ripple-connector'|'fly-marker-connector'|'flow-particles-connector'|'reveal-connector'} & style;
interface NodeEffects { shake?; breathing?; [kind:string]: unknown }
interface GroupOptions { autoFit?; userResizable?; padding?; collapsed?; behindChildren?; headerHeight?; width?; height?; radius?; togglePlacement? }
```

### 9.4 Templates

→ full types in source [`template/types.ts`](../packages/graph/src/template/types.ts). Summary:

```ts
type NodeStructureTemplate = SimpleStructure | CardStructure | FreeformStructure;
interface SimpleStructure   { name; kind:'simple'; shape: NodeShapeOptions; slots?:{label?;icon?;badge?} }
interface CardStructure     { name; kind:'card'; width; height; padding?; frame?: CompositeFrame; rows: CardRow[] }
interface FreeformStructure { name; kind:'freeform'; width; height; cornerRadius?; frame?; bgRole?/bg?; strokeRole?/stroke?; strokeWidth?; elements: CardElement[] }  // designer output
type CardElement = (common & {type:'text'; bind?; text?; font*; colorRole?/color?; maxWidth?; maxLines?; anchor?})
  | (common & {type:'rect'; width; height; cornerRadius?; fillRole?/fill?})
  | (common & {type:'circle'; radius; fillRole?/fill?}) | (common & {type:'line'; x2; y2; colorRole?/color?; strokeWidth?})
  | (common & {type:'image'; size; shape?; bind?});      // common = { id; x; y; label?; hidden? }
interface NodeStylingTemplate { name; fillRole?/fill?; strokeRole?/stroke?; strokeWidth?; label?: LabelStyling; bgRole?/bg?; accentRole?/accent?; slots?: Record<string, SlotStyling> }
interface NodeTypeBinding    { structure: string; styling: string; bindings: Record<slot, dottedPath>; fields?: {key;label}[] }
type CompositeFrame = {kind:'rect';cornerRadius?} | {kind:'ellipse'} | {kind:'regular-polygon';sides;rotation?} | {kind:'polygon';points}
```

Colour fields are a **pair** everywhere: `*Role` (themed `ColorRole`) **or** a direct numeric `*` (fixed). `*Role` wins.

### 9.5 Theme

Source [`theme/types.ts`](../packages/graph/src/theme/types.ts).

```ts
type ColorRole = 'surface'|'cardBg'|'foreground'|'heading'|'muted'|'accent'|'divider'|'stroke'|'selectionRing'|'hoverRing';
interface ThemePalette extends Record<ColorRole, number> { categorical: number[] }
interface Theme { name; label?; light: ThemePalette; dark: ThemePalette }
type ThemeMode = 'system'|'light'|'dark';
```

---

## 10. Source → target mapping (the one-glance table)

| Today (source of truth) | Class | Target home in `canvas-store` |
|---|---|---|
| `CanvasConfig.{layers,behaviours,layouts,activeLayout}` | DEFINITION | `view.definition.{layers,behaviours,layouts,activeLayout}` |
| `CanvasOptions` scene bits / `Camera` zoom limits | DEFINITION | `view.definition.canvas` (**new**) |
| `CanvasOptions` renderer-init (`preference`, `antialias`, …) | DEFINITION | **renderer adapter config** (not synced) |
| `GraphLayerOptions.{node,edge,nodeStructureTemplates,…}` | DEFINITION | `view.definition.{styling,templates}` |
| `ThemeBehaviour.{themes,active,mode,accent}` | DEFINITION | `view.definition.theme` |
| `ColorByLabel`/`DegreeSize` options | DEFINITION | `view.definition.styling.rules` |
| `ClickSelect.selected` / `Hover.current` | INTERACTION | `view.interaction.{selection,hover}` |
| `GraphStore.nodeRuntimeStates` | INTERACTION | `view.interaction.states` |
| `Camera.viewport` transform | INTERACTION | `view.interaction.camera` (abstract) |
| Lasso path / brush rect / drag offsets | INTERACTION (gesture) | **stays behaviour-local** |
| every layout's `running` / force `alpha` | RUNTIME-OBS | `view.runtime.layout` (**new**) |
| `Canvas._currentMessage` | RUNTIME-OBS | `view.runtime.message` (**new**) |
| `GraphNode.{type,data,parentId,states,style,state}` | DATA-COLD | `data[id].records` |
| `GraphNode.{position,pinned}` | DATA-HOT | `data[id]` typed-array columns |
| `BubbleSet` / group-node `parentId` | DATA-COLD + DEFINITION | `data[id].groups` (members) + `view.definition` (style) |
| group/contour geometry, merged style, palette | DERIVED | recomputed in projection (not stored) |
| `container`/`mountTarget`/`renderer`/`store`/`workerFactory` | HANDLE | renderer-adapter-private (not in kernel) |

---

## 11. Cross-cutting decisions (what doesn't fit cleanly)

Surfaced independently by every package survey — these are the real design calls.

1. **`states` is overloaded 3 ways.** (a) named-state *style catalogue* → `definition.styling.stateCatalogue` + per-element override in `data`; (b) *document* flag list `GraphNode.states[]` (e.g. `disabled`) → `data`; (c) *presence* hover/selected/highlighted → `interaction.states`. Renderer reads the **union**. **Decompose `GraphNode.states`** when state moves into the kernel.
2. **Per-element record fuses 3 physics** (`position/pinned` hot · `data/style/state` cold · `states[]` doc). Kernel `data` needs **two lanes**; the real `GraphStore` already splits them but the kernel's `LayerData` is cold-only.
3. **Derived-but-written-back.** `ColorByLabel`, `DegreeSize`, `ParallelEdge`, and the **layouts** compute DERIVED values and persist them into data/template, keeping a `prior*` shadow to restore on disable. Decide: store the write as data, or re-apply as derivation?
4. **Function-valued config breaks "serialisable definition."** `Resolvable*Style` (everywhere), layout `nodeSize/separation/value/sort`, behaviour `filter/createNode/onSelect`, `workerFactory`. **`view.definition` is not fully JSON/CRDT-serialisable** as-is — needs a serialisable subset + named-resolver registry story.
5. **Live handles as "options"** (`container`, `mountTarget`, `renderer`, `store`, `workerFactory`) — separate from the synced definition.
6. **Two group models + a third planned** — unify on keyed many-to-many `groups` (memberIds + derived geometry); group style → definition, membership → data, geometry → derived/throttled.
7. **Interaction scattered across behaviours** — line drawn: shared semantic (selection/hover/presence) → `interaction`; gesture-local (lasso path/brush rect/drag offsets) → behaviour-local.
8. **Camera ownership inverts under a basemap** (`MapLayer` makes MapLibre authoritative). Need an explicit "who owns `{x,y,zoom}` when a basemap is present" rule.
9. **Auxiliary stores** — `GraphHistory` (data undo) + `GraphClipboard` vs kernel `createHistory` (view patches). Decide whether data ops are undoable; clipboard = ephemeral interaction.
</content>
</invoke>
