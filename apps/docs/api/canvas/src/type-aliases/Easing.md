# Type Alias: Easing

> **Easing** = (`t`) => `number`

Defined in: [packages/canvas/src/primitives/animation/easings.ts:11](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/easings.ts#L11)

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
