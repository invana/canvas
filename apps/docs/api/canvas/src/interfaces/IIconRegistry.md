# Interface: IIconRegistry

Defined in: packages/canvas/src/primitives/types.ts:105

Look up icon-rendering info for an `IconRef`.

Defined as an interface here so `types.ts` has no inward dependency on
sibling primitives files. The concrete class lives in
`primitives/icons/IconRegistry.ts` (created in step 5 of the v0 plan).

## Methods

### resolve()

> **resolve**(`ref`): [`IconResolution`](../type-aliases/IconResolution.md)

Defined in: packages/canvas/src/primitives/types.ts:107

Resolve an icon reference to renderable instructions. Throws on miss.

#### Parameters

##### ref

[`IconRef`](../type-aliases/IconRef.md)

#### Returns

[`IconResolution`](../type-aliases/IconResolution.md)

***

### tracePath()

> **tracePath**(`g`, `pathD`): `void`

Defined in: packages/canvas/src/primitives/types.ts:109

Trace an SVG `pathD` string into a Pixi `Graphics`. Used for lucide + svg providers.

#### Parameters

##### g

[`Graphics`](Graphics.md)

##### pathD

`string`

#### Returns

`void`
