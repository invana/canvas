# Interface: MountedDecoration\<TStyle\>

A mounted decoration, seen from the engine side. Generic in its host info, so
this reference carries no backend type — a layer can hold one, tick it and
read its padding without knowing what it draws into.

## Type Parameters

### TStyle

`TStyle` = `unknown`

## Properties

### style

> `readonly` **style**: `TStyle`

## Methods

### getEndPadding()?

> `optional` **getEndPadding**(): `object`

#### Returns

`object`

##### source

> `readonly` **source**: `number`

##### target

> `readonly` **target**: `number`

***

### getOuterExtent()?

> `optional` **getOuterExtent**(): `number`

#### Returns

`number`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`
