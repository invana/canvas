# Type Alias: RevealRepeat

> **RevealRepeat** = `boolean` \| `number`

Repeat semantics for the reveal animation.

- `false` — one-shot. Reveal runs once, then either settles fully drawn
  (`holdAtFull: true`) or clears.
- `true` — infinite loop. Reveal restarts from 0 each cycle.
- `number` — finite cycle count (must be `>= 1`).
