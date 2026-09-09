# Interface: LayerFlush

The per-frame coalesced delta across all four collections.

## Properties

### annotations

> **annotations**: [`KindDelta`](KindDelta.md)

***

### edges

> **edges**: [`KindDelta`](KindDelta.md)

***

### groups

> **groups**: [`KindDelta`](KindDelta.md)

***

### nodes

> **nodes**: [`NodeDelta`](NodeDelta.md)

***

### version

> **version**: `number`

Monotonic version — bumps once per flush.
