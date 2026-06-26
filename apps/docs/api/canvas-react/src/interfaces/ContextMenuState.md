# Interface: ContextMenuState\<T\>

Defined in: [canvas-react/src/hooks/useContextMenu.ts:4](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L4)

Open menu: where it sits (screen / canvas-relative px) + what it carries.

## Type Parameters

### T

`T`

## Properties

### items

> **items**: `T`

Defined in: [canvas-react/src/hooks/useContextMenu.ts:10](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L10)

Caller-defined payload — typically the per-target menu items to render.

***

### x

> **x**: `number`

Defined in: [canvas-react/src/hooks/useContextMenu.ts:6](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L6)

Left offset in px, relative to the positioned ancestor (the `<Canvas>` host).

***

### y

> **y**: `number`

Defined in: [canvas-react/src/hooks/useContextMenu.ts:8](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useContextMenu.ts#L8)

Top offset in px, relative to the positioned ancestor.
