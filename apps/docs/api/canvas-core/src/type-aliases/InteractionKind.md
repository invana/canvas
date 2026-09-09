# Type Alias: InteractionKind

> **InteractionKind** = `"idle"` \| `"pan"` \| `"zoom"` \| `"drag"` \| `"hover"` \| `"layout"`

The user-interaction category a frame is attributed to. A deliberately small,
closed set so it is safe to use as a metric/span **dimension** (bounded
cardinality). `'idle'` is the default when no gesture is active.
