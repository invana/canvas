# Interface: SpecProjectorOptions

## Properties

### onKindChange?

> `optional` **onKindChange?**: (`id`) => `void`

Called before an element is removed and re-added because its `kind` changed.
A host may be tracking decoration / badge slots that the removal disposes.

#### Parameters

##### id

`string`

#### Returns

`void`
