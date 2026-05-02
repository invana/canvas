# Storybook Inventory — pre-migration snapshot

Captured before deleting `apps/storybook` for the architecture rewrite. Every story below must have an equivalent in the new storybook before the migration is considered complete.

Format: `Storybook title → file → exported story names`. Old `Plugins/*` titles indicate the story will move under the new architecture's Layer / Behaviour / Renderer hierarchy (see the "New home" hint).

`FeatureRoadmap.mdx` (613 lines) preserved at repo root as `migration-feature-roadmap.mdx`.

---

## 1. Showcase

| Title | File | Stories |
|---|---|---|
| `1. Showcase/Performance/Large Graph` | `canvas/showcase/LargeGraph.stories.ts` | `LargeGridGraph` |

**New home:** top-level `Showcase/*` — composed of `GraphLayer` + layout.

---

## 2. Canvas Core

| Title | File | Stories |
|---|---|---|
| `2. Node Styles` | `canvas/canvas-core/Shapes.stories.ts` | `AllShapes` |

**New home:** `Renderer/ShapesRenderer/Node Shapes` — exercises shape primitives directly.

---

## 3. Canvas / Animations

### Camera
| Title | File | Stories |
|---|---|---|
| `Canvas/Animations/Camera` | `canvas/animations/camera/Camera.stories.ts` | `CameraControls` |

### Nodes
| Title | File | Stories |
|---|---|---|
| `Canvas/Animations/Nodes` | `canvas/animations/nodes/BorderGlow.stories.ts` | `BorderGlow` |
| `Canvas/Animations/Nodes` | `canvas/animations/nodes/Breathe.stories.ts` | `Breathe` |
| `Canvas/Animations/Nodes` | `canvas/animations/nodes/ColorCycle.stories.ts` | `ColorCycle` |
| `Canvas/Animations/Nodes` | `canvas/animations/nodes/DashedFlow.stories.ts` | `DashedFlow` |
| `Canvas/Animations/Nodes` | `canvas/animations/nodes/FadeIn.stories.ts` | `FadeIn` |
| `Canvas/Animations/Nodes` | `canvas/animations/nodes/MarchingAnts.stories.ts` | `MarchingAnts` |
| `Canvas/Animations/Nodes` | `canvas/animations/nodes/Pulse.stories.ts` | `Pulse` |

**New home:** `Canvas/Animations/*` — animation system is unchanged per architecture-proposal §8.

---

## 4. Canvas / Edges

| Title | File | Stories |
|---|---|---|
| `Canvas/Edges/AllShapes` | `canvas/edges/AllShapes.stories.ts` | `AllEdgeShapes` |
| `Canvas/Edges/Connectors` | `canvas/edges/Connectors.stories.ts` | `Straight`, `Bezier`, `Cubic`, `CubicHorizontal`, `CubicVertical`, `Orthogonal`, `Quadratic`, `Rounded`, `Smooth`, `LoopCurve`, `LoopPolyline` |
| `Canvas/Edges/Markers` | `canvas/edges/Markers.stories.ts` | `Markers` |
| `Canvas/Edges/Routers` | `canvas/edges/Routers.stories.ts` | `NormalRouter`, `OrthRouter`, `OneSideRouter`, `ErRouter` |
| `Canvas/Edges/Styling/Halos` | `canvas/edges/styling/Halos.stories.ts` | `EdgeHalo` |
| `Canvas/Edges/Styling/Stroke` | `canvas/edges/styling/Stroke.stories.ts` | `EdgeStroke` |

**New home:** `Renderer/ShapesRenderer/Connectors/*` (connectors, routers, markers are renderer primitives) and/or `Layer/Graph/Edges/*` (when exercised via GraphLayer).

---

## 5. Canvas / Nodes

### Custom nodes
| Title | File | Stories |
|---|---|---|
| `Canvas/Nodes/Custom Nodes` | `canvas/nodes/customise/CustomNode.stories.ts` | `CustomNodeTypes` |
| `Canvas/Nodes/Custom Nodes/ER Entity (Ports)` | `canvas/nodes/customise/EREntity.stories.ts` | `EREntityPorts` |
| `Canvas/Nodes/Custom Nodes/Polyline (Leaf)` | `canvas/nodes/customise/PolylineLeaf.stories.ts` | `PolylineLeaf` |

### Events
| Title | File | Stories |
|---|---|---|
| `Canvas/Nodes/Events` | `canvas/nodes/events/EventsInteractive.stories.ts` | `EventsInteractive` |

### States
| Title | File | Stories |
|---|---|---|
| `Canvas/Nodes/States` | `canvas/nodes/states/AllStates.stories.ts` | `AllStates` |
| `Canvas/Nodes/States` | `canvas/nodes/states/AllStatesInteractive.stories.ts` | `AllStatesInteractive` |
| `Canvas/Nodes/States` | `canvas/nodes/states/CustomInteractiveState.stories.ts` | `CustomInteractiveState` |
| `Canvas/Nodes/States` | `canvas/nodes/states/CustomStates.stories.ts` | `CustomStates` |

### Styling
| Title | File | Stories |
|---|---|---|
| `Canvas/Nodes/Styling` | `canvas/nodes/styling/Halos.stories.ts` | `HaloShowcase` |
| `Canvas/Nodes/Styling/Badges` | `canvas/nodes/styling/Badges.stories.ts` | `AllPositions`, `ShapeVariants`, `GraphLikeExample` |
| `Canvas/Nodes/Styling/Icons` | `canvas/nodes/styling/Icons.stories.ts` | `Icons` |
| `Canvas/Nodes/Styling/Icons/FontAwesome` | `canvas/nodes/styling/IconsFontAwesome.stories.ts` | `Solid`, `Brands`, `BrandWithHalo` |
| `Canvas/Nodes/Styling/Icons/Lucide` | `canvas/nodes/styling/IconsLucide.stories.ts` | `White`, `Tinted`, `IconWithDecorations` |
| `Canvas/Nodes/Styling/Labels` | `canvas/nodes/styling/Labels.stories.ts` | `Positions`, `BackgroundsAndTruncation`, `MultiLabel`, `EdgeLabels`, `LayerVisibility` |
| `Canvas/Nodes/Styling/Stroke` | `canvas/nodes/styling/Stroke.stories.ts` | `Stroke` |
| `Canvas/Nodes/Styling/Color/Linear Gradient` | `canvas/nodes/styling/color/LinearGradient.stories.ts` | `LinearGradient` |
| `Canvas/Nodes/Styling/Color/Radial Gradient` | `canvas/nodes/styling/color/RadialGradient.stories.ts` | `RadialGradient` |
| `Canvas/Nodes/Styling/Color/Solid Colors` | `canvas/nodes/styling/color/SolidColors.stories.ts` | `SolidColors` |

**New home:** Most node-styling stories exercise the renderer's shape spec → `Renderer/ShapesRenderer/Nodes/*`. Node-event stories belong under `Layer/Graph/Events/*` since semantic `node:click` events are owned by the layer.

---

## 6. Layouts

| Title | File | Stories |
|---|---|---|
| `Layouts/D3 Force/Les Misérables` | `layouts/d3-force/LesMiserables.stories.ts` | `LesMiserables` |
| `Layouts/ELK/Org Chart Scientists` | `layouts/elkjs/OrgChartScientists.stories.ts` | `OrgChartScientists` |
| `Layouts/ELK/Random Tree` | `layouts/elkjs/RandomTree.stories.ts` | `RandomTree` |

**New home:** `Layouts/*` — invoked via `await new D3ForceLayout().apply(graphLayer)` per architecture-proposal §2.3.

> ELK stories must be ported even though no `plugins-layouts-elkjs` package exists today — they currently live in storybook only. The new arch creates `@invana/graph-layout-elkjs` as a first-class package.

---

## 7. Plugins → New architecture buckets

The old `Plugins/*` namespace splits across Layers, Behaviours, and the (private) Renderer.

### Behaviours (formerly `Plugins/Behaviours`)
| Title | File | Stories | New home |
|---|---|---|---|
| `Plugins/Behaviours` | `plugins/BrushSelect.stories.ts` | `BrushSelect` | `Behaviours/BrushSelect` |
| `Plugins/Behaviours` | `plugins/ClickSelect.stories.ts` | `ClickSelect` | `Behaviours/ClickSelect` |
| `Plugins/Behaviours` | `plugins/HoverActivate.stories.ts` | `HoverActivate` | `Behaviours/HoverActivate` |
| `Plugins/Behaviours` | `plugins/LabelResolution.stories.ts` | `LabelResolution` | **deleted** — `LabelResolutionPlugin` is removed entirely (§4 of proposal); zoom-driven label rasterisation moves into `GraphLayer`. Story re-homed as `Layer/Graph/Labels/Resolution`. |
| `Plugins/Behaviours` | `plugins/LassoSelect.stories.ts` | `LassoSelect` | `Behaviours/LassoSelect` |

### ShapesPlugin → `Renderer/ShapesRenderer`
| Title | File | Stories | New home |
|---|---|---|---|
| `Plugins/ShapesPlugin/Connector Vertices` | `plugins/ShapesPlugin/connectors/ConnectorVertices.stories.ts` | `ConnectorVertices` | `Renderer/ShapesRenderer/Connectors/Vertices` |
| `Plugins/ShapesPlugin/Connectors` | `plugins/ShapesPlugin/connectors/Connectors.stories.ts` | `Connectors`, `ConnectorOffset` | `Renderer/ShapesRenderer/Connectors` |
| `Plugins/ShapesPlugin/Custom Connector` | `plugins/ShapesPlugin/connectors/CustomConnector.stories.ts` | `CustomConnector` | `Renderer/ShapesRenderer/Connectors/Custom` |
| `Plugins/ShapesPlugin/Custom Router` | `plugins/ShapesPlugin/connectors/CustomRouter.stories.ts` | `CustomRouter` | `Renderer/ShapesRenderer/Routers/Custom` |
| `Plugins/ShapesPlugin/Drag With Connectors` | `plugins/ShapesPlugin/connectors/DragWithConnectors.stories.ts` | `DragWithConnectors` | `Behaviours/DragMove` (with connectors visible) |
| `Plugins/ShapesPlugin/Routers` | `plugins/ShapesPlugin/connectors/Routers.stories.ts` | `Routers` | `Renderer/ShapesRenderer/Routers` |

### Background → `Layers/Background`
| Title | File | Stories | New home |
|---|---|---|---|
| `Plugins/Background/Patterns` | `plugins/background/BackgroundDots.stories.ts` | `BackgroundDots` | `Layers/Background/Patterns/Dots` |
| `Plugins/Background/Patterns` | `plugins/background/BackgroundGrid.stories.ts` | `BackgroundGrid` | `Layers/Background/Patterns/Grid` |
| `Plugins/Background/Patterns` | `plugins/background/BackgroundInteractive.stories.ts` | `BackgroundInteractive` | `Layers/Background/Patterns/Interactive` |
| `Plugins/Background/Patterns` | `plugins/background/BackgroundLines.stories.ts` | `BackgroundLines` | `Layers/Background/Patterns/Lines` |
| `Plugins/Background/Patterns` | `plugins/background/BackgroundSolid.stories.ts` | `BackgroundSolid` | `Layers/Background/Patterns/Solid` |
| `Plugins/Background/Events` | `plugins/background/events/BackgroundUpdated.stories.ts` | `BackgroundUpdated` | `Layers/Background/Events/Updated` |
| `Plugins/Background/Themes` | `plugins/background/themes/Blueprint.stories.ts` | `Blueprint` | `Layers/Background/Themes/Blueprint` |
| `Plugins/Background/Themes` | `plugins/background/themes/Dark.stories.ts` | `Dark` | `Layers/Background/Themes/Dark` |
| `Plugins/Background/Themes` | `plugins/background/themes/MinimalLight.stories.ts` | `MinimalLight` | `Layers/Background/Themes/MinimalLight` |
| `Plugins/Background/Themes` | `plugins/background/themes/Theming.stories.ts` | `Theming` | `Layers/Background/Themes/Theming` |

### ThemedBackground → `Layers/ThemedBackground`
| Title | File | Stories | New home |
|---|---|---|---|
| `Plugins/ThemedBackground` | `plugins/themed-background/Responsive.stories.ts` | `Responsive` | `Layers/ThemedBackground/Responsive` |
| `Plugins/ThemedBackground/Events` | `plugins/themed-background/events/ModeUpdated.stories.ts` | `ModeUpdated` | `Layers/ThemedBackground/Events/ModeUpdated` |
| `Plugins/ThemedBackground/Events` | `plugins/themed-background/events/ThemeSwitched.stories.ts` | `ThemeSwitched` | `Layers/ThemedBackground/Events/ThemeSwitched` |

### MiniMap → `Layers/MiniMap`
| Title | File | Stories | New home |
|---|---|---|---|
| `Plugins/MiniMap` | `plugins/minimap/MiniMap.stories.ts` | `MiniMap` | `Layers/MiniMap` |

### Dev Info → `Layers/DevInfo`
| Title | File | Stories | New home |
|---|---|---|---|
| `Plugins` | `plugins/dev-info-plugin/DevInfoPlugin.stories.ts` | `DevInfoOverlay` | `Layers/DevInfo` |

### Drawing → fold or drop (per proposal §4)
| Title | File | Stories | New home |
|---|---|---|---|
| `Plugins/Drawing` | `plugins/drawing-plugin/DrawingPlugin.CircuitBoard.stories.ts` | `CircuitBoard` | TBD — `DrawingPlugin` is dropped or folded into a `draw/` utility module. Stories may become `Renderer/ShapesRenderer/Showcase/*` or be removed. |
| `Plugins/Drawing` | `plugins/drawing-plugin/DrawingPlugin.ConstellationMap.stories.ts` | `ConstellationMap` | TBD |
| `Plugins/Drawing` | `plugins/drawing-plugin/DrawingPlugin.KidsArt.stories.ts` | `KidsArt` | TBD |
| `Plugins/Drawing` | `plugins/drawing-plugin/DrawingPlugin.Masterpiece.stories.ts` | `Masterpiece` | TBD |

---

## Other content

| File | Notes |
|---|---|
| `stories/FeatureRoadmap.mdx` | 613-line roadmap doc. Preserved at repo root as `migration-feature-roadmap.mdx`. |

---

## Counts

- **Story files:** 67 (66 `.stories.ts` + 1 `.mdx`)
- **Exported stories:** ~95 (counted by export count)
- **To be ported:** all except `LabelResolution` (re-homed) and the 4 `Drawing` stories (TBD).
