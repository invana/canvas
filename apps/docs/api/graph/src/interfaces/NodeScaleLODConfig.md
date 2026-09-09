# Interface: NodeScaleLODConfig

Per-`GraphLayer` config — one entry per layer this behaviour rescales.

## Properties

### preserveRelativeSize?

> `optional` **preserveRelativeSize?**: `boolean`

**Preserve relative sizes.** By default this behaviour drives every node
to a *uniform* `sizePx` screen size, which flattens any per-node sizing
(e.g. from `NodeCentralityBehaviour`). Set this `true` to instead keep each
node's *resolved* (natural) size — hubs stay bigger than leaves — and only
make it **zoom-invariant** (constant screen size across camera scale). So
it composes with centrality sizing instead of overriding it. `sizePx` /
`strokeWidthPx` are ignored in this mode. Default `false`.

***

### sizePx?

> `optional` **sizePx?**: `NumberOrGetter`

Target body size in screen px for nodes that don't carry a per-node
`data.size` override. Falls back to the layer's `nodeDefaults.size`
when omitted. Accepts a static number or a getter — getters re-read
on every reflow so GUI sliders update live.

***

### strokeWidthPx?

> `optional` **strokeWidthPx?**: `NumberOrGetter`

Target outline width in screen px. When omitted, the layer's
`nodeDefaults.strokeWidth` (or each node's `data.strokeWidth`) is
reinterpreted as the implicit pixel target — the transform-scale
fast path always pins both body and stroke together, so the stroke
is pixel-constant even without an explicit value here. Setting an
explicit value just changes what that pixel target is.

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` whose nodes are rescaled.
