# Interface: PulseRingDecorationStyle

Defined in: packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts:15

Concentric rings that expand outward from the host's silhouette and fade
as they grow. A canonical "attention" decoration — pings, notifications,
"new arrival" indicators, sonar effects.

Each ring traces the host silhouette via `paintInto` with a growing
`inset` (negative = outside) and shrinking alpha. Multiple concurrent
rings are scheduled by phase-offset across one period — so a `rings: 3`
decoration always shows three rings at different stages of expansion,
giving a steady visual rhythm.

## Properties

### color

> `readonly` **color**: `number`

Defined in: packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts:16

***

### innerAlpha?

> `readonly` `optional` **innerAlpha?**: `number`

Defined in: packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts:26

Initial (full-brightness) alpha at radius 0. Default `0.7`.

***

### maxRadius?

> `readonly` `optional` **maxRadius?**: `number`

Defined in: packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts:18

Peak expansion distance from the host silhouette, px. Default `24`.

***

### periodMs?

> `readonly` `optional` **periodMs?**: `number`

Defined in: packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts:20

Cycle length in ms. Default `1400`.

***

### rings?

> `readonly` `optional` **rings?**: `number`

Defined in: packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts:22

Number of concurrent rings (phase-distributed). Default `2`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: packages/canvas/src/primitives/decorations/shape/PulseRingDecoration.ts:24

Stroke width of each ring, px. Default `2`.
