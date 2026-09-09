# Interface: NodeCentralityOptions

The subset of `NodeCentralityBehaviourOptions` this editor produces — a
serialisable patch. The `sizeFn` callback override and the base
`id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope;
only the user-tunable scalars round-trip.

## Properties

### direction?

> `optional` **direction?**: `NodeCentralityDirection`

Edges counted per node: `'in'`, `'out'`, or `'both'` (default).

***

### labelMaxSize?

> `optional` **labelMaxSize?**: `number`

Upper clamp for the scaled label font. Default `40`.

***

### labelMinSize?

> `optional` **labelMinSize?**: `number`

Lower clamp for the scaled label font. Default `8`.

***

### labelScale?

> `optional` **labelScale?**: `number`

Scale the label with the node: labelFontSize = clamp(size × this, …). 0/blank = off.

***

### maxSize?

> `optional` **maxSize?**: `number`

Output `style.size` for the max-degree node. Default `32`.

***

### minSize?

> `optional` **minSize?**: `number`

Output `style.size` for a degree-0 node. Default `8`.

***

### scale?

> `optional` **scale?**: `NodeCentralityScale`

Curve applied to normalized degree. Default `'sqrt'`.

***

### weightKey?

> `optional` **weightKey?**: `string`

Numeric edge-`data` field to sum for weighted degree (e.g. `'weight'`). Blank = raw count.
