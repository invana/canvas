# Interface: TabbedRectGeometry

Every edge coordinate the silhouette, fold line and label box are built
from, resolved once against `inset`. `null` when the inset has collapsed the
geometry to nothing.

The inset is applied analytically per edge rather than via a polygon offset:
the re-entrant shoulder corners make a bisector offset unstable, and all but
the slanted edges are axis-aligned, so the exact answer is one addition.

## Properties

### bodyless

> **bodyless**: `boolean`

`true` when `spec.height <= 0` and the silhouette is the tab alone — the
closed folder. `left` / `right` / `bottom` describe the tab, and there is
no fold line. See bodylessGeometryOf.

***

### bottom

> **bottom**: `number`

***

### flushLeft

> **flushLeft**: `boolean`

***

### flushRight

> **flushRight**: `boolean`

***

### left

> **left**: `number`

***

### right

> **right**: `number`

***

### shoulder

> **shoulder**: `number`

Where the tab meets the body; the fold line's y.

***

### tabLeft

> **tabLeft**: `number`

Tab extent at its **base**, where it meets the body.

***

### tabRight

> **tabRight**: `number`

***

### tabTop

> **tabTop**: `number`

Top of the tab — the silhouette's topmost edge.

***

### tabTopLeft

> **tabTopLeft**: `number`

Tab extent at its **top**, narrowed by the slant on whichever side leans.

***

### tabTopRight

> **tabTopRight**: `number`
