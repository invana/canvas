# Type Alias: RevealRepeat

> **RevealRepeat** = `boolean` \| `number`

Defined in: [canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/connector/RevealConnectorDecoration.ts#L48)

Repeat semantics for the reveal animation.

- `false` — one-shot. Reveal runs once, then either settles fully drawn
  (`holdAtFull: true`) or clears.
- `true` — infinite loop. Reveal restarts from 0 each cycle.
- `number` — finite cycle count (must be `>= 1`).
