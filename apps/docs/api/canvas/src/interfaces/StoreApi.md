# Interface: StoreApi\<T\>

Defined in: node\_modules/.pnpm/zustand@5.0.12\_@types+react@19.2.2\_immer@11.1.4\_react@19.2.0\_use-sync-external-store@1.6.0\_react@19.2.0\_/node\_modules/zustand/vanilla.d.ts:9

## Type Parameters

### T

`T`

## Properties

### getInitialState

> **getInitialState**: () => `T`

Defined in: node\_modules/.pnpm/zustand@5.0.12\_@types+react@19.2.2\_immer@11.1.4\_react@19.2.0\_use-sync-external-store@1.6.0\_react@19.2.0\_/node\_modules/zustand/vanilla.d.ts:12

#### Returns

`T`

***

### getState

> **getState**: () => `T`

Defined in: node\_modules/.pnpm/zustand@5.0.12\_@types+react@19.2.2\_immer@11.1.4\_react@19.2.0\_use-sync-external-store@1.6.0\_react@19.2.0\_/node\_modules/zustand/vanilla.d.ts:11

#### Returns

`T`

***

### setState

> **setState**: \{(`partial`, `replace?`): `void`; (`state`, `replace`): `void`; \}

Defined in: node\_modules/.pnpm/zustand@5.0.12\_@types+react@19.2.2\_immer@11.1.4\_react@19.2.0\_use-sync-external-store@1.6.0\_react@19.2.0\_/node\_modules/zustand/vanilla.d.ts:10

#### Call Signature

> (`partial`, `replace?`): `void`

##### Parameters

###### partial

`T` \| `Partial`\<`T`\> \| ((`state`) => `T` \| `Partial`\<`T`\>)

###### replace?

`false`

##### Returns

`void`

#### Call Signature

> (`state`, `replace`): `void`

##### Parameters

###### state

`T` \| ((`state`) => `T`)

###### replace

`true`

##### Returns

`void`

***

### subscribe

> **subscribe**: (`listener`) => () => `void`

Defined in: node\_modules/.pnpm/zustand@5.0.12\_@types+react@19.2.2\_immer@11.1.4\_react@19.2.0\_use-sync-external-store@1.6.0\_react@19.2.0\_/node\_modules/zustand/vanilla.d.ts:13

#### Parameters

##### listener

(`state`, `prevState`) => `void`

#### Returns

() => `void`
