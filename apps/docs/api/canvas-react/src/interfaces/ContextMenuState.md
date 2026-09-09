# Interface: ContextMenuState\<T\>

Open menu: where it sits (screen / canvas-relative px) + what it carries.

## Type Parameters

### T

`T`

## Properties

### items

> **items**: `T`

Caller-defined payload — typically the per-target menu items to render.

***

### x

> **x**: `number`

Left offset in px, relative to the positioned ancestor (the `<Canvas>` host).

***

### y

> **y**: `number`

Top offset in px, relative to the positioned ancestor.
