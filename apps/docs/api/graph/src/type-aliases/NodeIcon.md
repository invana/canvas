# Type Alias: NodeIcon

> **NodeIcon** = \{ `alpha?`: `number`; `anchor?`: `InsetAnchor`; `char`: `string`; `color?`: `number`; `fontFamily?`: `string`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"glyph"`; `sizeRatio?`: `number`; \} \| \{ `alpha?`: `number`; `anchor?`: `InsetAnchor`; `color?`: `number`; `kind`: `"svg"`; `pathD`: `string`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \} \| \{ `alpha?`: `number`; `anchor?`: `InsetAnchor`; `color?`: `number`; `kind`: `"svg-url"`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `url`: `string`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \}

Defined in: [graph/src/layer/types.ts:370](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L370)

Vector inset rendered inside a node's body — glyph (font codepoint), SVG
path, or SVG by URL. Kept structured (discriminated union) because each
kind carries different required params.
