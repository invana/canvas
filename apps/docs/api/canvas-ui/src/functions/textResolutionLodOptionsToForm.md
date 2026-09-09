# Function: textResolutionLodOptionsToForm()

> **textResolutionLodOptionsToForm**(`o?`): [`TextResolutionLODOptions`](../interfaces/TextResolutionLODOptions.md)

Map a `TextResolutionLODBehaviourOptions`-shaped patch to the flat
[TextResolutionLODFields](../type-aliases/TextResolutionLODFields.md) the `@invana/forms` generator renders. Both
fields are numbers, so this is a straight pass-through. `levels[]` is dropped
(not modelled in the form).

## Parameters

### o?

[`TextResolutionLODOptions`](../interfaces/TextResolutionLODOptions.md) = `{}`

## Returns

[`TextResolutionLODOptions`](../interfaces/TextResolutionLODOptions.md)
