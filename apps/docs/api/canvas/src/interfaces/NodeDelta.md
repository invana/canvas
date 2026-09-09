# Interface: NodeDelta

Nodes also carry `moved` — position-only changes (transform-only re-render).

## Extends

- [`KindDelta`](KindDelta.md)

## Properties

### added

> **added**: `string`[]

#### Inherited from

[`KindDelta`](KindDelta.md).[`added`](KindDelta.md#added)

***

### changed

> **changed**: `string`[]

#### Inherited from

[`KindDelta`](KindDelta.md).[`changed`](KindDelta.md#changed)

***

### moved

> **moved**: `string`[]

Ids whose position changed this frame. Empty when [movedAll](#movedall) is set.

***

### movedAll

> **movedAll**: `boolean`

Every node moved (a force-sim tick via [LayerData.touchPositions](../../../canvas-store/src/classes/LayerData.md#touchpositions)) —
`moved` is left **empty** so the kernel doesn't allocate an N-id array each
frame; the renderer iterates all positions directly. O(1) per flush.

***

### removed

> **removed**: `string`[]

#### Inherited from

[`KindDelta`](KindDelta.md).[`removed`](KindDelta.md#removed)
