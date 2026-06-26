# Interface: UseLockOptions

Defined in: [canvas-react/src/hooks/useLock.ts:8](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLock.ts#L8)

## Properties

### behaviourIds?

> `optional` **behaviourIds?**: `string`[]

Defined in: [canvas-react/src/hooks/useLock.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLock.ts#L13)

Behaviour ids disabled while locked (re-enabled on unlock). Default
`['pan', 'drag-node']` — pan + node drag, leaving zoom available.

***

### initialLocked?

> `optional` **initialLocked?**: `boolean`

Defined in: [canvas-react/src/hooks/useLock.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLock.ts#L15)

Initial locked state. Default `false`.
