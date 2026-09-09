# Abstract Class: EffectBase\<TStyle\>

Base for effects that target shape primitives. An effect *modulates* the
host — wiggle its transform, override its tint/alpha — rather than adding
geometry alongside it (that's a decoration). The renderer reads each
effect's contribution every frame via `readTransform()` (transform effects)
or `readStyle()` (style effects), aggregates across all effects attached to
the same host, and applies the aggregate to the host's gfx.

Subclasses:
 - Declare `readonly target` as `'transform'` or `'style'`.
 - Implement `readTransform()` (target='transform') OR `readStyle()`
   (target='style'). The renderer calls only the one matching `target`.
 - Optionally implement `tick(deltaMs)` for animated effects. Returning
   `false` retires the effect from the renderer's per-frame set.

Effects do not own a Pixi container — they have no gfx. That's the
structural difference from `PrimitiveBase` children: shapes / connectors /
decorations draw, effects modulate.

## Extended by

- [`ShakeEffect`](ShakeEffect.md)
- [`BreathingEffect`](BreathingEffect.md)

## Type Parameters

### TStyle

`TStyle`

## Implements

- [`IShapeEffect`](../type-aliases/IShapeEffect.md)\<`TStyle`\>

## Constructors

### Constructor

> **new EffectBase**\<`TStyle`\>(`style`): `EffectBase`\<`TStyle`\>

#### Parameters

##### style

`TStyle`

#### Returns

`EffectBase`\<`TStyle`\>

## Properties

### host

> `protected` **host**: [`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md) = `null`

***

### style

> `readonly` **style**: `TStyle`

#### Implementation of

`IShapeEffect.style`

***

### target

> `abstract` `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md)

#### Implementation of

`IShapeEffect.target`

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Implementation of

`IShapeEffect.destroy`

***

### mount()

> **mount**(`host`): `void`

#### Parameters

##### host

[`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md)

#### Returns

`void`

#### Implementation of

`IShapeEffect.mount`

***

### readStyle()?

> `optional` **readStyle**(): [`StyleOverride`](../interfaces/StyleOverride.md)

Required by style-effects; the renderer ignores it for transform-effects.
Subclasses with `target='style'` must override.

#### Returns

[`StyleOverride`](../interfaces/StyleOverride.md)

#### Implementation of

`IShapeEffect.readStyle`

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](../interfaces/TransformDelta.md)

Required by transform-effects; the renderer ignores it for style-effects.
Subclasses with `target='transform'` must override.

#### Returns

[`TransformDelta`](../interfaces/TransformDelta.md)

#### Implementation of

`IShapeEffect.readTransform`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Optional per-frame advance. Subclasses override; the base no-ops. Return
`false` to retire the effect from the renderer's animation set.

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

#### Implementation of

`IShapeEffect.tick`

***

### update()

> **update**(`host`): `void`

#### Parameters

##### host

[`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md)

#### Returns

`void`

#### Implementation of

`IShapeEffect.update`
