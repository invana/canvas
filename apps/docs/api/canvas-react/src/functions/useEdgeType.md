# Function: useEdgeType()

> **useEdgeType**(`options?`, `canvas?`): [`UseEdgeTypeResult`](../interfaces/UseEdgeTypeResult.md)

Defined in: [canvas-react/src/hooks/useEdgeType.ts:73](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L73)

Layer-wide edge routing switch. Patches the `GraphLayer` edge template
(`options.edge.style.shape.pathType`) via GraphLayer.setEdgeDefaults,
which re-renders every edge and becomes the default for edges added later —
the engine-side `pathType` shorthand resolves to the right router + pathStyle
pair (e.g. `'orth'`, `'bezier'`, `'rounded'`).

The prior `shape` is spread before patching so anchors / waypoints survive
(`setEdgeDefaults` replaces structured fields wholesale). State is owned by
the hook and seeded from `layer.edgeDefaults` on mount.

## Parameters

### options?

[`UseEdgeTypeOptions`](../interfaces/UseEdgeTypeOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseEdgeTypeResult`](../interfaces/UseEdgeTypeResult.md)
