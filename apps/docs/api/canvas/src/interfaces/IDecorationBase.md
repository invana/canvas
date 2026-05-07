# Interface: IDecorationBase\<THostInfo, TStyle\>

Defined in: [packages/canvas/src/renderers/types.ts:347](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L347)

Base for both shape and connector decorations. Presence of `tick` makes
the decoration animated and registers it into the renderer's per-frame
animation set; otherwise the decoration costs zero per frame after its
initial draw.

`tick` returns `true` to keep ticking, `false` to retire (renderer drops
it from the animation set).

## Type Parameters

### THostInfo

`THostInfo`

### TStyle

`TStyle` = `unknown`

## Properties

### style

> `readonly` **style**: `TStyle`

Defined in: [packages/canvas/src/renderers/types.ts:348](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L348)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [packages/canvas/src/renderers/types.ts:352](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L352)

#### Returns

`void`

***

### mount()

> **mount**(`host`): `void`

Defined in: [packages/canvas/src/renderers/types.ts:349](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L349)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [packages/canvas/src/renderers/types.ts:351](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L351)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [packages/canvas/src/renderers/types.ts:350](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L350)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
