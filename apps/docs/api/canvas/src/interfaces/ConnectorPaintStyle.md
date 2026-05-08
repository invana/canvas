# Interface: ConnectorPaintStyle

Defined in: packages/canvas/src/primitives/types.ts:184

Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:186

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: packages/canvas/src/primitives/types.ts:190

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:185

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: packages/canvas/src/primitives/types.ts:188

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:189

***

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: packages/canvas/src/primitives/types.ts:191

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:187

***

### tintMarkers?

> `readonly` `optional` **tintMarkers?**: `boolean`

Defined in: packages/canvas/src/primitives/types.ts:198

When `true`, markers paint with `color` / `alpha` instead of their own
spec colors. Glow / halo decorations use this so the decoration covers
path + markers as a unified silhouette; marching-ants leaves it
undefined so markers stay normal-colored over the dashed line.
