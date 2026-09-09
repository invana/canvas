# Type Alias: ElkAlgorithmName

> **ElkAlgorithmName** = `"layered"` \| `"mrtree"` \| `"radial"` \| `"force"` \| `"stress"` \| `"disco"` \| `"sporeOverlap"` \| `"sporeCompaction"` \| `"box"` \| `"rectpacking"` \| `"random"` \| `"fixed"` \| `string` & `object`

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
