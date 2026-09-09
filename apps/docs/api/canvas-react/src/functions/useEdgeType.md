# Function: useEdgeType()

> **useEdgeType**(`options?`, `canvas?`): [`UseEdgeTypeResult`](../interfaces/UseEdgeTypeResult.md)

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
