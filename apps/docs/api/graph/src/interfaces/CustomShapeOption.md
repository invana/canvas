# Interface: CustomShapeOption

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
