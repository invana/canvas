# Interface: RevealConnectorDecorationStyle

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

Wait this many ms after mount before starting the reveal. Default `0`.

***

### direction?

> `readonly` `optional` **direction?**: [`RevealDirection`](../type-aliases/RevealDirection.md)

Sweep direction. Default `'source-to-target'`.

***

### durationMs?

> `readonly` `optional` **durationMs?**: `number`

Duration of one full source→target sweep in ms. Default `2000`.

***

### easing?

> `readonly` `optional` **easing?**: [`RevealEasingName`](../type-aliases/RevealEasingName.md)

Easing curve. Default `'linear'` — constant "pen speed" feels most natural for a drawing reveal.

***

### holdAtFull?

> `readonly` `optional` **holdAtFull?**: `boolean`

When `repeat` is `false`, hold the fully-drawn state after the cycle
completes (handing off to the host stroke when `hostStroke: 'hide'`).
Ignored for infinite / finite-repeat modes. Default `true`.

***

### hostStroke?

> `readonly` `optional` **hostStroke?**: [`RevealHostStroke`](../type-aliases/RevealHostStroke.md)

Treatment of the underlying host connector stroke. Default `'hide'`.

***

### repeat?

> `readonly` `optional` **repeat?**: [`RevealRepeat`](../type-aliases/RevealRepeat.md)

`false` = one-shot (default), `true` = infinite, or a positive integer cycle count.
