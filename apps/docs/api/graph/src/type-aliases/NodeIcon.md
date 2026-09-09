# Type Alias: NodeIcon

> **NodeIcon** = \{ `alpha?`: `number`; `anchor?`: [`SpecStore`](../../../canvas/src/variables/SpecStore.md); `char`: `string`; `color?`: `number`; `fontFamily?`: `string`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"glyph"`; `sizeRatio?`: `number`; \} \| \{ `alpha?`: `number`; `anchor?`: [`SpecStore`](../../../canvas/src/variables/SpecStore.md); `color?`: `number`; `kind`: `"svg"`; `pathD`: `string`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \} \| \{ `alpha?`: `number`; `anchor?`: [`SpecStore`](../../../canvas/src/variables/SpecStore.md); `color?`: `number`; `kind`: `"svg-url"`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `url`: `string`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \}

Vector inset rendered inside a node's body — glyph (font codepoint), SVG
path, or SVG by URL. Kept structured (discriminated union) because each
kind carries different required params.
