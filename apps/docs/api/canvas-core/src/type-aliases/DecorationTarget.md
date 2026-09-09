# Type Alias: DecorationTarget

> **DecorationTarget** = `"shape"` \| `"connector"` \| `"both"`

Constructor type for shapes registered via `registerShape`. Optionally
exposes a `static paintInto` so the shape can also serve as a connector
marker. Shapes without `paintInto` cannot be used as markers.
