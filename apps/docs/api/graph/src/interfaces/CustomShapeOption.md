# Interface: CustomShapeOption

Defined in: [graph/src/layer/types.ts:282](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L282)

Escape-hatch variant for shape kinds registered at runtime via
`canvas.primitives.registerShape(name, ctor)`. The widened `kind` accepts
any string the type-checker can't match against a built-in variant;
additional spec params are erased at the type level but pass through to
the renderer untouched at runtime (the adapter spreads the whole shape
record into the spec).

Authors of custom shapes typically declare a local interface
(`interface ChevronShapeOption { kind: 'chevron'; size: number }`) and
cast at the boundary (`style: { shape: chevron as NodeShapeOptions }`).
The index signature was deliberately omitted here so that discriminant
narrowing on the typed built-in variants (`shape.kind === 'rect'` →
`RectShapeOption`) keeps working everywhere else in the codebase.

Built-in kinds (`'rect'`, `'circle'`, `'arc'`, `'regular-polygon'`,
`'star'`, `'polygon'`) are matched by the typed variants above before
this fallback applies.

## Properties

### kind

> `readonly` **kind**: `string` & `object`

Defined in: [graph/src/layer/types.ts:283](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L283)
