# Class: BreathingConnectorEffect

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:27](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L27)

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

## Extends

- [`ConnectorEffectBase`](ConnectorEffectBase.md)\<[`BreathingConnectorEffectStyle`](../interfaces/BreathingConnectorEffectStyle.md)\>

## Constructors

### Constructor

> **new BreathingConnectorEffect**(`style`): `BreathingConnectorEffect`

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:35](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L35)

#### Parameters

##### style

[`BreathingConnectorEffectStyle`](../interfaces/BreathingConnectorEffectStyle.md)

#### Returns

`BreathingConnectorEffect`

#### Overrides

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`constructor`](ConnectorEffectBase.md#constructor)

## Properties

### host

> `protected` **host**: `ConnectorEffectHostInfo` = `null`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:34](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L34)

#### Inherited from

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`host`](ConnectorEffectBase.md#host)

***

### style

> `readonly` **style**: [`BreathingConnectorEffectStyle`](../interfaces/BreathingConnectorEffectStyle.md)

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:33](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L33)

#### Inherited from

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`style`](ConnectorEffectBase.md#style)

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md) = `'style'`

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:28](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L28)

#### Overrides

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`target`](ConnectorEffectBase.md#target)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:48](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L48)

#### Returns

`void`

#### Inherited from

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`destroy`](ConnectorEffectBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:40](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L40)

#### Parameters

##### host

`ConnectorEffectHostInfo`

#### Returns

`void`

#### Inherited from

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`mount`](ConnectorEffectBase.md#mount)

***

### readStyle()

> **readStyle**(): [`StyleOverride`](../interfaces/StyleOverride.md)

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:50](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L50)

#### Returns

[`StyleOverride`](../interfaces/StyleOverride.md)

#### Overrides

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`readStyle`](ConnectorEffectBase.md#readstyle)

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](../interfaces/TransformDelta.md)

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:54](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L54)

#### Returns

[`TransformDelta`](../interfaces/TransformDelta.md)

#### Inherited from

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`readTransform`](ConnectorEffectBase.md#readtransform)

***

### tick()

> **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts:42](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/connector/BreathingConnectorEffect.ts#L42)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

#### Overrides

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`tick`](ConnectorEffectBase.md#tick)

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ConnectorEffectBase.ts:44](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ConnectorEffectBase.ts#L44)

#### Parameters

##### host

`ConnectorEffectHostInfo`

#### Returns

`void`

#### Inherited from

[`ConnectorEffectBase`](ConnectorEffectBase.md).[`update`](ConnectorEffectBase.md#update)
