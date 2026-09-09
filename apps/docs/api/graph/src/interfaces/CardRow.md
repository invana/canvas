# Interface: CardRow

One row of a [CardStructure](CardStructure.md): either content slots or a divider line.

## Properties

### divider?

> `optional` **divider?**: `boolean`

Render a hairline divider for this row (uses the `divider` slot styling).

***

### slots?

> `optional` **slots?**: [`CardSlot`](../type-aliases/CardSlot.md)[]

Left → right cells. Omit for a pure divider row.
