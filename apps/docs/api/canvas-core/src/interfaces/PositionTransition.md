# Interface: PositionTransition

Handle to an in-flight [animatePositions](../functions/animatePositions.md) transition.

## Properties

### done

> `readonly` **done**: `boolean`

`true` once the transition has finished or been cancelled.

## Methods

### cancel()

> **cancel**(): `void`

Abort the transition. `onComplete` will not fire; positions stop where they are.

#### Returns

`void`
