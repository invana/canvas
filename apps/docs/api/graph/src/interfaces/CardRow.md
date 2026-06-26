# Interface: CardRow

Defined in: graph/src/template/types.ts:53

One row of a [CardStructure](CardStructure.md): either content slots or a divider line.

## Properties

### divider?

> `optional` **divider?**: `boolean`

Defined in: graph/src/template/types.ts:57

Render a hairline divider for this row (uses the `divider` slot styling).

***

### slots?

> `optional` **slots?**: [`CardSlot`](../type-aliases/CardSlot.md)[]

Defined in: graph/src/template/types.ts:55

Left → right cells. Omit for a pure divider row.
