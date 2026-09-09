# Function: colorByFields()

> **colorByFields**(`values?`): `FieldConfig`[]

`@invana/forms` field schema for the `ColorByBehaviour` editor.

**A function of the live values, not a static array** — which is the whole
reason category and range are one behaviour rather than two. The two modes
read disjoint option sets, so the schema is resolved from the current `mode`
and `scale` (the panel feeds it from a `useWatch`), exactly as
`DensityContourFillLayerEditorPanel` and ~20 other editors already do.

It implements the behaviour's validity matrix directly:

```
always            → mode, nodeValueKey, edgeValueKey, colorNodes, colorEdges, fallbackColor
mode 'categorical'   → + maxCategories
mode 'range'      → + scale
  continuous        → + nodeDomain[min,max], edgeDomain[min,max]   (blank = auto)
  'quantile'        → + bins, nodeDomain[min,max], edgeDomain[min,max]
  'threshold'       → + nodeThresholds, edgeThresholds
```

Field `name`s match [ColorByFields](../interfaces/ColorByFields.md) 1:1 so the `options.<name>` paths
line up with `mapping.ts`. `palette` and `valueColors` have no fields —
`FieldType` has no array or map kind.

## Parameters

### values?

[`ColorByFields`](../interfaces/ColorByFields.md) = `{}`

## Returns

`FieldConfig`[]
