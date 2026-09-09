# Interface: SpecFlush

One coalesced batch of spec changes. Ids only — the receiver reads the specs
it cares about, so a flush stays O(dirty) regardless of collection size.

## Properties

### added

> `readonly` **added**: readonly `string`[]

***

### changed

> `readonly` **changed**: readonly `string`[]

***

### removed

> `readonly` **removed**: readonly `string`[]

***

### version

> `readonly` **version**: `number`

Monotonic, per store. Lets a consumer detect a missed batch.
