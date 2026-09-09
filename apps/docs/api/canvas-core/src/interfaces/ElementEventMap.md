# Interface: ElementEventMap

A string-keyed event map (`{ eventType: payload }`) — the conventional generic
bound for scoped [EventEmitter](../classes/EventEmitter.md)s (layer / behaviour / domain-store event
channels). `EventEmitter`/`SourceEmitter` accept any `object`; this is the
portable shape most maps use.

## Extends

- [`EventMap`](../type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### background:contextmenu

> **background:contextmenu**: `object`

Right-button release on empty canvas — no shape/connector was hit.

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:click

> **connector:click**: `object`

Left-button click. Right-button → `connector:contextmenu`.

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:contextmenu

> **connector:contextmenu**: `object`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:doubleclick

> **connector:doubleclick**: `object`

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerdown

> **connector:pointerdown**: `object`

#### button

> **button**: `number`

#### id

> **id**: `string`

#### pointerId

> **pointerId**: `number`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerout

> **connector:pointerout**: `object`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerover

> **connector:pointerover**: `object`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerup

> **connector:pointerup**: `object`

#### button

> **button**: `number`

#### id

> **id**: `string`

#### pointerId

> **pointerId**: `number`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:click

> **shape:click**: `object`

Left-button click. Right-button → `shape:contextmenu`.

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:contextmenu

> **shape:contextmenu**: `object`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:doubleclick

> **shape:doubleclick**: `object`

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:partcontextmenu

> **shape:partcontextmenu**: `object`

Right-click over a hittable sub-part. Emitted *instead of*
`shape:contextmenu` when the cursor is over a `hitId`-tagged part, so a
consumer can show a part-scoped menu (e.g. a field row) and reserve the
shape-level menu for the rest of the card.

#### id

> **id**: `string`

#### partId

> **partId**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:partout

> **shape:partout**: `object`

#### id

> **id**: `string`

#### partId

> **partId**: `string`

***

### shape:partover

> **shape:partover**: `object`

Sub-part pointer transitions — fired only for shapes that implement
IShape.hitTestPart (e.g. a composite card with `hitId`-tagged
parts). `partId` is the id the shape returned for the point under the
cursor. `partover` fires on entering a part; `partout` on leaving it (to
another part of the same shape, or off the shape entirely).

#### id

> **id**: `string`

#### partId

> **partId**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerdown

> **shape:pointerdown**: `object`

#### button

> **button**: `number`

#### id

> **id**: `string`

#### pointerId

> **pointerId**: `number`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerout

> **shape:pointerout**: `object`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerover

> **shape:pointerover**: `object`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerup

> **shape:pointerup**: `object`

#### button

> **button**: `number`

#### id

> **id**: `string`

#### pointerId

> **pointerId**: `number`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`
