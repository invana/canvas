# Interface: ISurfaceHost

The lifecycle half of the renderer contract: how surfaces come into being.
The drawing half is [IElementRenderer](IElementRenderer.md), reached through a surface.

## Methods

### createSurface()

> **createSurface**(`space`, `id`, `opts?`): [`ISurface`](ISurface.md)

#### Parameters

##### space

[`SurfaceSpace`](../type-aliases/SurfaceSpace.md)

##### id

`string`

##### opts?

[`SurfaceOptions`](SurfaceOptions.md)

#### Returns

[`ISurface`](ISurface.md)
