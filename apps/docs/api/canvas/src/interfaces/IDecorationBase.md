# Interface: IDecorationBase\<THostInfo, TStyle\>

Defined in: [packages/canvas/src/primitives/types.ts:639](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L639)

Common base for shape and connector decorations. Presence of `tick` makes
the decoration animated — the renderer registers it into the per-frame
animation set; `tick` returns `true` to keep ticking, `false` to retire.
Static decorations omit `tick` and cost zero per frame after `mount`.

## Type Parameters

### THostInfo

`THostInfo`

### TStyle

`TStyle` = `unknown`

## Properties

### style

> `readonly` **style**: `TStyle`

Defined in: [packages/canvas/src/primitives/types.ts:640](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L640)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/types.ts:644](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L644)

#### Returns

`void`

***

### mount()

> **mount**(`host`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:641](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L641)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:643](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L643)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:642](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L642)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
