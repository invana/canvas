# Function: nodeScaleLodOptionsToForm()

> **nodeScaleLodOptionsToForm**(`o?`): [`NodeScaleLODOptions`](../interfaces/NodeScaleLODOptions.md)

Map a `NodeScaleLODBehaviourOptions`-shaped patch to the flat
[NodeScaleLODFields](../type-aliases/NodeScaleLODFields.md) the `@invana/forms` generator renders. Both fields
are numbers, so this is a straight pass-through. `layers[]` is dropped (not
modelled in the form).

## Parameters

### o?

[`NodeScaleLODOptions`](../interfaces/NodeScaleLODOptions.md) = `{}`

## Returns

[`NodeScaleLODOptions`](../interfaces/NodeScaleLODOptions.md)
