# Abstract Class: ConnectorEffectBase\<TStyle\>

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

#### Parameters

##### style

`TStyle`

#### Returns

`ConnectorEffectBase`\<`TStyle`\>

## Properties

### host

> `protected` **host**: `ConnectorEffectHostInfo` = `null`

***

### style

> `readonly` **style**: `TStyle`

#### Implementation of

`IConnectorEffect.style`

***

### target

> `abstract` `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md)

#### Implementation of

`IConnectorEffect.target`

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Implementation of

`IConnectorEffect.destroy`

***

### mount()

> **mount**(`host`): `void`

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

#### Returns

[`StyleOverride`](../interfaces/StyleOverride.md)

#### Implementation of

`IConnectorEffect.readStyle`

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](../interfaces/TransformDelta.md)

#### Returns

[`TransformDelta`](../interfaces/TransformDelta.md)

#### Implementation of

`IConnectorEffect.readTransform`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

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

#### Parameters

##### host

`ConnectorEffectHostInfo`

#### Returns

`void`

#### Implementation of

`IConnectorEffect.update`
