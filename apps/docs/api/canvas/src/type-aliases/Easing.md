# Type Alias: Easing

> **Easing** = (`t`) => `number`

Defined in: [canvas/src/primitives/animation/easings.ts:11](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/animation/easings.ts#L11)

Easing functions consumed by `Tween`. Each is a pure `(t: number) => number`
where `t ∈ [0, 1]` is normalised progress and the return value is the eased
progress (also typically in `[0, 1]`, though overshoot easings may exceed).

Naming follows the standard easing taxonomy (Penner et al). Add new entries
here rather than inline-defining easings in effect / decoration code so the
set stays consistent across animated primitives.

## Parameters

### t

`number`

## Returns

`number`
