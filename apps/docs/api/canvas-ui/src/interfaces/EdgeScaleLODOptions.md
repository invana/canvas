# Interface: EdgeScaleLODOptions

The subset of `EdgeScaleLODBehaviourOptions` this editor produces — a
serialisable patch. Only the base `ElementScaleLODBehaviourOptions` scalars
(`scaleEpsilon`, `settleMs`) round-trip.

**`layers[]` is omitted on purpose.** The per-`GraphLayer` config array
(`{ targetLayerId, strokeWidthPx }[]`, each entry potentially a getter) is
structural and identity-bearing, with no `FieldType` in the form generator —
it stays out of the form and is left untouched on `setOptions`.

## Properties

### scaleEpsilon?

> `optional` **scaleEpsilon?**: `number`

Skip the per-frame apply when the relative scale change is below this
threshold. Default `0.005` (0.5%).

***

### settleMs?

> `optional` **settleMs?**: `number`

When `> 0`, debounce the apply to a trailing edge `settleMs` after zoom
silence instead of running per RAF frame. Default `80` for this behaviour.
