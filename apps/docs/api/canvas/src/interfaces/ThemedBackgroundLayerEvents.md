# Interface: ThemedBackgroundLayerEvents

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:66](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L66)

Layer-event map fired by `ThemedBackgroundLayer.events`.

## Indexable

> \[`event`: `string`\]: `unknown`

## Properties

### mode:updated

> **mode:updated**: `object`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:72](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L72)

#### mode

> **mode**: [`ThemedBackgroundMode`](../type-aliases/ThemedBackgroundMode.md)

#### previousMode

> **previousMode**: [`ThemedBackgroundMode`](../type-aliases/ThemedBackgroundMode.md)

#### resolvedKind

> **resolvedKind**: [`ThemedBackgroundKind`](../type-aliases/ThemedBackgroundKind.md)

#### source

> **source**: `"manual"` \| `"system"`

***

### theme:switched

> **theme:switched**: `object`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:67](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L67)

#### resolvedKind

> **resolvedKind**: [`ThemedBackgroundKind`](../type-aliases/ThemedBackgroundKind.md)

#### source

> **source**: `"initial"` \| `"manual"`

#### theme

> **theme**: [`ThemedBackgroundTheme`](ThemedBackgroundTheme.md)
