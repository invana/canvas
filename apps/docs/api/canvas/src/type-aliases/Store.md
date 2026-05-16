# Type Alias: Store\<T\>

> **Store**\<`T`\> = `Omit`\<`StoreApi`\<`T`\>, `"setState"` \| `"subscribe"`\> & `object`

Defined in: [canvas/src/state/Store.ts:73](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/state/Store.ts#L73)

The store API surface exposed to consumers.

After middleware composition, the runtime store has:
  - `setState(recipe)` — immer recipe that mutates a draft (immer middleware).
  - `setState(partial)` and `setState(updater)` — vanilla forms (still work).
  - `subscribe(listener)` — vanilla zustand API.
  - `subscribe(selector, listener, opts?)` — added by `subscribeWithSelector`.

The `setState` overload union mirrors what the immer middleware produces at
runtime; `Store<T>` is what `createLayerStore<T>()` returns.

## Type Declaration

### setState

> **setState**: \{(`recipe`): `void`; (`partial`, `replace?`): `void`; (`state`, `replace`): `void`; \}

#### Call Signature

> (`recipe`): `void`

Immer recipe form — mutate the draft, return nothing. Preferred.

##### Parameters

###### recipe

(`draft`) => `void`

##### Returns

`void`

#### Call Signature

> (`partial`, `replace?`): `void`

Direct partial / replacement / updater forms — also accepted.

##### Parameters

###### partial

`T` \| `Partial`\<`T`\> \| ((`state`) => `void` \| `T` \| `Partial`\<`T`\>)

###### replace?

`false`

##### Returns

`void`

#### Call Signature

> (`state`, `replace`): `void`

Replace-state form (second arg = true).

##### Parameters

###### state

`T`

###### replace

`true`

##### Returns

`void`

### subscribe

> **subscribe**: `StoreApi`\<`T`\>\[`"subscribe"`\] & \<`U`\>(`selector`, `listener`, `options?`) => () => `void`

## Type Parameters

### T

`T`
