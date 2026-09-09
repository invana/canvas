# Function: edgeScaleLodOptionsToForm()

> **edgeScaleLodOptionsToForm**(`o?`): [`EdgeScaleLODOptions`](../interfaces/EdgeScaleLODOptions.md)

Map an `EdgeScaleLODBehaviourOptions`-shaped patch to the flat
[EdgeScaleLODFields](../type-aliases/EdgeScaleLODFields.md) the `@invana/forms` generator renders. Both fields
are numbers, so this is a straight pass-through. `layers[]` is dropped (not
modelled in the form).

## Parameters

### o?

[`EdgeScaleLODOptions`](../interfaces/EdgeScaleLODOptions.md) = `{}`

## Returns

[`EdgeScaleLODOptions`](../interfaces/EdgeScaleLODOptions.md)
