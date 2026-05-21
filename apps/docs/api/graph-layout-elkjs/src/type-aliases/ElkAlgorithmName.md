# Type Alias: ElkAlgorithmName

> **ElkAlgorithmName** = `"layered"` \| `"mrtree"` \| `"radial"` \| `"force"` \| `"stress"` \| `"disco"` \| `"sporeOverlap"` \| `"sporeCompaction"` \| `"box"` \| `"rectpacking"` \| `"random"` \| `"fixed"` \| `string` & `object`

Defined in: [graph-layout-elkjs/src/types.ts:40](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L40)

Built-in ELK algorithm names shipped in `elkjs/lib/elk.bundled.js`.

`'layered'` (Sugiyama hierarchical, the default) is the right choice for
most directed graphs. The other algorithms cover specialised cases:

 - `'mrtree'` — tidy tree, single root.
 - `'radial'` — radial tree.
 - `'force'` — Eades / Fruchterman–Reingold force-directed.
 - `'stress'` — multi-dimensional scaling stress majorisation.
 - `'disco'` — disconnected-component packing wrapper.
 - `'sporeOverlap'` / `'sporeCompaction'` — SPOrE post-processors.
 - `'box'` / `'rectpacking'` — pack rectangles without edges.
 - `'random'` — debugging baseline.
 - `'fixed'` — keep user-supplied coordinates; only resolves edges.

Pass any string to use a custom-registered algorithm.
