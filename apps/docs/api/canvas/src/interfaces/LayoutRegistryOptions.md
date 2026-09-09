# Interface: LayoutRegistryOptions

`LayoutRegistry` — stores the Layouts registered on a Canvas, addressed by id.

Simpler than `LayerRegistry` / `BehaviourRegistry`: layouts aren't mounted,
z-ordered, or wired to input — they're held so `Canvas.update()` can push
config to them by id and consumers can fetch + `apply()` them. A graph runs
one layout at a time, but several may be registered (e.g. a layout picker).

## Properties

### bus

> **bus**: [`CanvasEventBus`](../classes/CanvasEventBus.md)
