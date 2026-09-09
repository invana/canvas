# Type Alias: RevealHostStroke

> **RevealHostStroke** = `"hide"` \| `"overlay"`

How the underlying host connector should be treated during reveal.

- `'hide'` — the host's gfx is set invisible while the decoration is
  active; the decoration owns the only visible line. On one-shot
  completion (with `holdAtFull`) the host is restored to visible and the
  decoration clears its own gfx, so markers + native stroke take over.
- `'overlay'` — the host stays visible; the decoration paints a brighter
  "progress" segment on top. Best for laser-sweep / data-flow visuals on
  infinite loops.
