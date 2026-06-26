# Type Alias: EffectTarget

> **EffectTarget** = `"transform"` \| `"style"`

Defined in: [canvas/src/primitives/types.ts:859](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L859)

What an effect modulates. Distinguishes effects that wiggle the host's
transform (shake, breathing, jiggle) from effects that override the host's
style channels (shimmer, fade-pulse, color-flash).

Effects are NOT decorations. A decoration adds geometry alongside the host;
an effect modulates the host itself. Spec is untouched in either case — the
renderer applies the effect's contribution to the host's gfx each frame.
