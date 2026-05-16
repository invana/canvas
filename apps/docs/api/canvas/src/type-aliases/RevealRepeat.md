# Type Alias: RevealRepeat

> **RevealRepeat** = `boolean` \| `number`

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:48](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L48)

Repeat semantics for the reveal animation.

- `false` — one-shot. Reveal runs once, then either settles fully drawn
  (`holdAtFull: true`) or clears.
- `true` — infinite loop. Reveal restarts from 0 each cycle.
- `number` — finite cycle count (must be `>= 1`).
