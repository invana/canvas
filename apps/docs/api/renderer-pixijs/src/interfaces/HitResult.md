# Interface: HitResult

Hit-test result shape.

Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.

## Properties

### id

> `readonly` **id**: `string`

***

### kind

> `readonly` **kind**: `"shape"` \| `"connector"`

***

### subId?

> `readonly` `optional` **subId?**: `string`

Optional sub-region (e.g. a connector handle, a shape sub-part).
