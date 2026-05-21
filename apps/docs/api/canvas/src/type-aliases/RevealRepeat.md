# Type Alias: RevealRepeat

> **RevealRepeat** = `boolean` \| `number`

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:48](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L48)

Repeat semantics for the reveal animation.

- `false` — one-shot. Reveal runs once, then either settles fully drawn
  (`holdAtFull: true`) or clears.
- `true` — infinite loop. Reveal restarts from 0 each cycle.
- `number` — finite cycle count (must be `>= 1`).
