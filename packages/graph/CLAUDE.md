# CLAUDE.md — packages/graph (`@invana/graph`)

Graph-domain layers and behaviours that compose `@invana/canvas`. Replaces the old `@invana/plugins-graph-data` (now `*-deprecated`).

**Status:** skeleton.

## Scope (per proposal §5)

- `GraphLayer` (extends `WorldLayer`) — wraps a `ShapesRenderer` internally, owns graph data + interaction state.
- `MiniMapLayer` (extends `ScreenLayer`) — viewport-fixed minimap of a source `GraphLayer`.
- Behaviours: `HoverActivateBehaviour`, `ClickSelectBehaviour`, `LassoSelectBehaviour`, `BrushSelectBehaviour`, `PanBehaviour`, `DragMoveBehaviour`.
- Types: `INodeData`, `IEdgeData`, `IGraphStyles`.

## Rules

- No `pixi.js` imports — go through `@invana/canvas` API only.
- Behaviours don't auto-enable; the developer registers + enables them explicitly.
- Cross-layer deps via explicit `*LayerId` option fields (proposal §2.4).
