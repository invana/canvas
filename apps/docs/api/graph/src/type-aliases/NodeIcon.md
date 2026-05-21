# Type Alias: NodeIcon

> **NodeIcon** = \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](../../../canvas/src/type-aliases/InsetAnchor.md); `char`: `string`; `color?`: `number`; `fontFamily?`: `string`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"glyph"`; `sizeRatio?`: `number`; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](../../../canvas/src/type-aliases/InsetAnchor.md); `color?`: `number`; `kind`: `"svg"`; `pathD`: `string`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](../../../canvas/src/type-aliases/InsetAnchor.md); `color?`: `number`; `kind`: `"svg-url"`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `url`: `string`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \}

Defined in: [graph/src/layer/types.ts:340](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L340)

Vector inset rendered inside a node's body — glyph (font codepoint), SVG
path, or SVG by URL. Kept structured (discriminated union) because each
kind carries different required params.
