# Type Alias: CardSlot

> **CardSlot** = \{ `kind`: `"tag"` \| `"text"`; `slot`: `string`; \} \| \{ `kind`: `"image"`; `shape?`: `"circle"` \| `"rounded"`; `size?`: `number`; `slot`: `string`; \} \| \{ `stack`: `CardSlot`[]; \}

Defined in: graph/src/template/types.ts:61

A cell within a [CardRow](../interfaces/CardRow.md).
