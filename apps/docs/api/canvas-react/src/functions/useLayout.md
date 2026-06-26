# Function: useLayout()

> **useLayout**(`layouts`, `options?`, `canvas?`): [`UseLayoutResult`](../interfaces/UseLayoutResult.md)

Defined in: [canvas-react/src/hooks/useLayout.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L49)

Imperative layout switching, lifting the common "instantiate → `apply(layer)`
→ `camera.fitContent`" pattern into a hook. Layouts live in separate packages
(`@invana/graph-layout-*`) with no registry, so the consumer supplies a map of
**factories**; this hook can't be turnkey.

Memoize the `layouts` map (module scope or `useMemo`) so `applyLayout` stays
stable across renders.

## Parameters

### layouts

`Record`\<`string`, [`LayoutFactory`](../type-aliases/LayoutFactory.md)\>

### options?

[`UseLayoutOptions`](../interfaces/UseLayoutOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseLayoutResult`](../interfaces/UseLayoutResult.md)
