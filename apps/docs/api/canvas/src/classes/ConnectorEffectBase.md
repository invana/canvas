# Abstract Class: ConnectorEffectBase\<TStyle\>

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:30](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L30)

Base for effects that target connector primitives. Mirror of `EffectBase`
for shape effects — the effect modulates the host connector's style
(tint / alpha) rather than adding geometry alongside it.

Subclasses:
 - Declare `readonly target` as `'style'` (typical) or `'transform'`.
   Note: the renderer ignores `'transform'` for connector hosts because
   translating / rotating / scaling a path-resolved primitive has no
   coherent meaning — effects that need to perturb endpoints should
   mutate the input polyline upstream of routing, not modulate gfx.
 - Implement `readStyle()`. The renderer aggregates contributions
   across every effect attached to the same connector (`tint` is
   last-writer-wins per channel; `alpha` multipliers compose).
 - Optionally implement `tick(deltaMs)` for animated effects. Returning
   `false` retires the effect from the renderer's per-frame set.

Effects do not own a Pixi container — they have no gfx. The structural
difference from `ConnectorDecorationBase` is the same as for shapes:
decorations draw, effects modulate.

## Extended by

- [`BreathingConnectorEffect`](BreathingConnectorEffect.md)
- [`FadeInConnectorEffect`](FadeInConnectorEffect.md)

## Type Parameters

### TStyle

`TStyle`

## Implements

- `IConnectorEffect`\<`TStyle`\>

## Constructors

### Constructor

> **new ConnectorEffectBase**\<`TStyle`\>(`style`): `ConnectorEffectBase`\<`TStyle`\>

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:36](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L36)

#### Parameters

##### style

`TStyle`

#### Returns

`ConnectorEffectBase`\<`TStyle`\>

## Properties

### host

> `protected` **host**: `ConnectorEffectHostInfo` = `null`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:34](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L34)

***

### style

> `readonly` **style**: `TStyle`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:33](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L33)

#### Implementation of

`IConnectorEffect.style`

***

### target

> `abstract` `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md)

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:31](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L31)

#### Implementation of

`IConnectorEffect.target`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:48](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L48)

#### Returns

`void`

#### Implementation of

`IConnectorEffect.destroy`

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:40](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L40)

#### Parameters

##### host

`ConnectorEffectHostInfo`

#### Returns

`void`

#### Implementation of

`IConnectorEffect.mount`

***

### readStyle()?

> `optional` **readStyle**(): [`StyleOverride`](../interfaces/StyleOverride.md)

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:56](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L56)

#### Returns

[`StyleOverride`](../interfaces/StyleOverride.md)

#### Implementation of

`IConnectorEffect.readStyle`

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](../interfaces/TransformDelta.md)

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:54](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L54)

#### Returns

[`TransformDelta`](../interfaces/TransformDelta.md)

#### Implementation of

`IConnectorEffect.readTransform`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:52](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L52)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

#### Implementation of

`IConnectorEffect.tick`

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:44](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L44)

#### Parameters

##### host

`ConnectorEffectHostInfo`

#### Returns

`void`

#### Implementation of

`IConnectorEffect.update`
