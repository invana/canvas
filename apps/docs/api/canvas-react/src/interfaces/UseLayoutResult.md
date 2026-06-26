# Interface: UseLayoutResult

Defined in: [canvas-react/src/hooks/useLayout.ts:29](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L29)

## Properties

### applyLayout

> **applyLayout**: (`key`) => `void`

Defined in: [canvas-react/src/hooks/useLayout.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L35)

Apply the layout registered under `key`, then fit the view.

#### Parameters

##### key

`string`

#### Returns

`void`

***

### isRunning

> **isRunning**: `boolean`

Defined in: [canvas-react/src/hooks/useLayout.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L37)

True while a layout's `apply` promise is in flight.

***

### layout

> **layout**: `string`

Defined in: [canvas-react/src/hooks/useLayout.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L31)

Currently-applied layout key.

***

### layoutOptions

> **layoutOptions**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/hooks/useLayout.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L33)

Key → label map for a picker.
