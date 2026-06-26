# Interface: UseViewSectionOptions

Defined in: [canvas-react/src/hooks/useViewSection.ts:9](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewSection.ts#L9)

## Properties

### canvas?

> `optional` **canvas?**: `Canvas`

Defined in: [canvas-react/src/hooks/useViewSection.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewSection.ts#L17)

Explicit canvas instance; defaults to the context canvas.

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas-react/src/hooks/useViewSection.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewSection.ts#L13)

Layer the fit-to-content button targets. Default `'graph'`.

***

### lockBehaviourIds?

> `optional` **lockBehaviourIds?**: `string`[]

Defined in: [canvas-react/src/hooks/useViewSection.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewSection.ts#L15)

Behaviour ids disabled while locked. Default `['pan', 'drag-node']`.

***

### showLock?

> `optional` **showLock?**: `boolean`

Defined in: [canvas-react/src/hooks/useViewSection.ts:11](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewSection.ts#L11)

Include the lock-view toggle. Default `true`.
