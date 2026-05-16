# Type Alias: NodeIcon

> **NodeIcon** = \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](../../../canvas/src/type-aliases/InsetAnchor.md); `char`: `string`; `color?`: `number`; `fontFamily?`: `string`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"glyph"`; `sizeRatio?`: `number`; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](../../../canvas/src/type-aliases/InsetAnchor.md); `color?`: `number`; `kind`: `"svg"`; `pathD`: `string`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](../../../canvas/src/type-aliases/InsetAnchor.md); `color?`: `number`; `kind`: `"svg-url"`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `url`: `string`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \}

Defined in: [graph/src/layer/types.ts:354](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L354)

Vector inset rendered inside a node's body — glyph (font codepoint), SVG
path, or SVG by URL. Kept structured (discriminated union) because each
kind carries different required params.
