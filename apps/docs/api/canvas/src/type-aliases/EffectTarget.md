# Type Alias: EffectTarget

> **EffectTarget** = `"transform"` \| `"style"`

Defined in: [canvas/src/primitives/types.ts:767](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L767)

What an effect modulates. Distinguishes effects that wiggle the host's
transform (shake, breathing, jiggle) from effects that override the host's
style channels (shimmer, fade-pulse, color-flash).

Effects are NOT decorations. A decoration adds geometry alongside the host;
an effect modulates the host itself. Spec is untouched in either case — the
renderer applies the effect's contribution to the host's gfx each frame.
