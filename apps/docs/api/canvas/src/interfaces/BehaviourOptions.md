# Interface: BehaviourOptions

## Extended by

- [`DragPanBehaviourOptions`](DragPanBehaviourOptions.md)
- [`DragShapeBehaviourOptions`](DragShapeBehaviourOptions.md)
- [`WheelZoomBehaviourOptions`](WheelZoomBehaviourOptions.md)
- [`PinchZoomBehaviourOptions`](PinchZoomBehaviourOptions.md)
- [`KeyboardCameraInputBehaviourOptions`](KeyboardCameraInputBehaviourOptions.md)
- [`ElementScaleLODBehaviourOptions`](ElementScaleLODBehaviourOptions.md)
- [`HoverActivateBehaviourOptions`](../../../graph/src/interfaces/HoverActivateBehaviourOptions.md)
- [`ClickSelectBehaviourOptions`](../../../graph/src/interfaces/ClickSelectBehaviourOptions.md)
- [`ClickInspectBehaviourOptions`](../../../graph/src/interfaces/ClickInspectBehaviourOptions.md)
- [`ClickViewBehaviourOptions`](../../../graph/src/interfaces/ClickViewBehaviourOptions.md)
- [`HoverElementPreviewBehaviourOptions`](../../../graph/src/interfaces/HoverElementPreviewBehaviourOptions.md)
- [`ColorByBehaviourOptions`](../../../graph/src/interfaces/ColorByBehaviourOptions.md)
- [`BrushSelectBehaviourOptions`](../../../graph/src/interfaces/BrushSelectBehaviourOptions.md)
- [`LassoSelectBehaviourOptions`](../../../graph/src/interfaces/LassoSelectBehaviourOptions.md)
- [`DragNodeBehaviourOptions`](../../../graph/src/interfaces/DragNodeBehaviourOptions.md)
- [`ContextMenuBehaviourOptions`](../../../graph/src/interfaces/ContextMenuBehaviourOptions.md)
- [`CreateNodeBehaviourOptions`](../../../graph/src/interfaces/CreateNodeBehaviourOptions.md)
- [`DrawEdgeBehaviourOptions`](../../../graph/src/interfaces/DrawEdgeBehaviourOptions.md)
- [`EraseBehaviourOptions`](../../../graph/src/interfaces/EraseBehaviourOptions.md)
- [`CollapseExpandBehaviourOptions`](../../../graph/src/interfaces/CollapseExpandBehaviourOptions.md)
- [`NodeResizeBehaviourOptions`](../../../graph/src/interfaces/NodeResizeBehaviourOptions.md)
- [`LabelCollisionBehaviourOptions`](../../../graph/src/interfaces/LabelCollisionBehaviourOptions.md)
- [`TextResolutionLODBehaviourOptions`](../../../graph/src/interfaces/TextResolutionLODBehaviourOptions.md)
- [`ParallelEdgeBehaviourOptions`](../../../graph/src/interfaces/ParallelEdgeBehaviourOptions.md)
- [`NodeCentralityBehaviourOptions`](../../../graph/src/interfaces/NodeCentralityBehaviourOptions.md)
- [`ContentLODBehaviourOptions`](../../../graph/src/interfaces/ContentLODBehaviourOptions.md)
- [`EdgeLODBehaviourOptions`](../../../graph/src/interfaces/EdgeLODBehaviourOptions.md)
- [`ThemeBehaviourOptions`](../../../graph/src/interfaces/ThemeBehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

***

### id

> **id**: `string`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.
