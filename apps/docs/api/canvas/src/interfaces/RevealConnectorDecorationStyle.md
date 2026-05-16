# Interface: RevealConnectorDecorationStyle

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:68](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L68)

Connector decoration that progressively reveals the routed path from one
endpoint to the other — as if the line were being drawn in real time.
Useful as an entrance animation for new edges, a directional "data-flow"
pulse, or a laser-sweep effect for active routes.

Implementation: the host `Path` is densified into a polyline on mount
(via `samplePath`); per-frame the decoration computes a cumulative-arc-
length cutoff from the driving `Tween` and emits a `lineTo` walk plus a
single `stroke()` for the revealed segment. Curves stay smooth because
the polyline already uses the engine-wide sampling step counts.

Markers are intentionally not painted by this decoration. When
`hostStroke: 'hide'` and the animation completes with `holdAtFull: true`,
the host connector's gfx is re-shown so its native stroke + markers
take over the final display. For infinite loops the host stays hidden
for the lifetime of the decoration.

## Properties

### delayMs?

> `readonly` `optional` **delayMs?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:86](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L86)

Wait this many ms after mount before starting the reveal. Default `0`.

***

### direction?

> `readonly` `optional` **direction?**: [`RevealDirection`](../type-aliases/RevealDirection.md)

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:76](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L76)

Sweep direction. Default `'source-to-target'`.

***

### durationMs?

> `readonly` `optional` **durationMs?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:70](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L70)

Duration of one full source→target sweep in ms. Default `2000`.

***

### easing?

> `readonly` `optional` **easing?**: [`RevealEasingName`](../type-aliases/RevealEasingName.md)

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:74](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L74)

Easing curve. Default `'linear'` — constant "pen speed" feels most natural for a drawing reveal.

***

### holdAtFull?

> `readonly` `optional` **holdAtFull?**: `boolean`

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:84](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L84)

When `repeat` is `false`, hold the fully-drawn state after the cycle
completes (handing off to the host stroke when `hostStroke: 'hide'`).
Ignored for infinite / finite-repeat modes. Default `true`.

***

### hostStroke?

> `readonly` `optional` **hostStroke?**: [`RevealHostStroke`](../type-aliases/RevealHostStroke.md)

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:78](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L78)

Treatment of the underlying host connector stroke. Default `'hide'`.

***

### repeat?

> `readonly` `optional` **repeat?**: [`RevealRepeat`](../type-aliases/RevealRepeat.md)

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:72](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L72)

`false` = one-shot (default), `true` = infinite, or a positive integer cycle count.
