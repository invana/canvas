# Interface: PositionTransition

Defined in: [canvas/src/layouts/animatePositions.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L31)

Handle to an in-flight [animatePositions](../functions/animatePositions.md) transition.

## Properties

### done

> `readonly` **done**: `boolean`

Defined in: [canvas/src/layouts/animatePositions.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L35)

`true` once the transition has finished or been cancelled.

## Methods

### cancel()

> **cancel**(): `void`

Defined in: [canvas/src/layouts/animatePositions.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L33)

Abort the transition. `onComplete` will not fire; positions stop where they are.

#### Returns

`void`
