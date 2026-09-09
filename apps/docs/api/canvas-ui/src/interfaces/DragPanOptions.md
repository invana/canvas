# Interface: DragPanOptions

The subset of `DragPanBehaviourOptions` this editor produces — a serialisable
patch. The base `id` / `targetLayerId` / `enabled` / `shortcuts` fields are
out of scope; only the user-tunable scalars round-trip.

## Properties

### decelerate?

> `optional` **decelerate?**: `boolean`

Add momentum deceleration after pointer lift.

***

### dragCursor?

> `optional` **dragCursor?**: `string`

Cursor applied to the canvas while the pan pointer is held.

***

### modifier?

> `optional` **modifier?**: `"none"` \| `"shift"` \| `"alt"` \| `"space"`

Which modifier key must be held during drag.

***

### mouseButtons?

> `optional` **mouseButtons?**: `"left"` \| `"right"` \| `"middle"` \| `"all"`

Allowed mouse buttons.
