# Type Alias: IconResolution

> **IconResolution** = \{ `fontFamily?`: `string`; `glyph`: `string`; `type`: `"text"`; \} \| \{ `pathD`: `string`; `type`: `"path"`; \}

Defined in: packages/canvas/src/primitives/types.ts:94

Registry-resolved rendering instructions for an `IconRef`. The icon-layer
helper switches on `type` to decide whether to mount a Pixi `Text`
(`'text'` — for unicode + fontawesome glyphs) or a `Graphics` traced from
SVG path data (`'path'` — for lucide + arbitrary svg).
