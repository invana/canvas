# Class: IconRegistry

Defined in: packages/canvas/src/primitives/icons/IconRegistry.ts:19

Look up icon-rendering info for an `IconRef`.

Defined as an interface here so `types.ts` has no inward dependency on
sibling primitives files. The concrete class lives in
`primitives/icons/IconRegistry.ts` (created in step 5 of the v0 plan).

## Implements

- [`IIconRegistry`](../interfaces/IIconRegistry.md)

## Constructors

### Constructor

> **new IconRegistry**(): `IconRegistry`

#### Returns

`IconRegistry`

## Methods

### registerFontAwesome()

> **registerFontAwesome**(`name`, `codepoint`): `void`

Defined in: packages/canvas/src/primitives/icons/IconRegistry.ts:29

Register or override a FontAwesome glyph's unicode codepoint.

#### Parameters

##### name

`string`

##### codepoint

`number`

#### Returns

`void`

***

### registerLucide()

> **registerLucide**(`name`, `pathD`): `void`

Defined in: packages/canvas/src/primitives/icons/IconRegistry.ts:24

Register or override a Lucide icon's SVG `d` attribute.

#### Parameters

##### name

`string`

##### pathD

`string`

#### Returns

`void`

***

### resolve()

> **resolve**(`ref`): [`IconResolution`](../type-aliases/IconResolution.md)

Defined in: packages/canvas/src/primitives/icons/IconRegistry.ts:33

Resolve an icon reference to renderable instructions. Throws on miss.

#### Parameters

##### ref

[`IconRef`](../type-aliases/IconRef.md)

#### Returns

[`IconResolution`](../type-aliases/IconResolution.md)

#### Implementation of

[`IIconRegistry`](../interfaces/IIconRegistry.md).[`resolve`](../interfaces/IIconRegistry.md#resolve)

***

### tracePath()

> **tracePath**(`g`, `pathD`): `void`

Defined in: packages/canvas/src/primitives/icons/IconRegistry.ts:64

Trace SVG `pathD` data into a Pixi `Graphics`. Pixi v8's `GraphicsPath`
accepts an SVG path string directly and handles all command kinds
(M / L / H / V / C / S / Q / T / A / Z plus relative variants).

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### pathD

`string`

#### Returns

`void`

#### Implementation of

[`IIconRegistry`](../interfaces/IIconRegistry.md).[`tracePath`](../interfaces/IIconRegistry.md#tracepath)
