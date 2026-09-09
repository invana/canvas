# Type Alias: CameraInputModifier

> **CameraInputModifier** = `"control"` \| `"shift"` \| `"alt"` \| `"meta"` \| `"space"`

A modifier key an input gesture can be gated on. Semantic on purpose — the
binding maps these to whatever key codes its backend wants.

`space` is a held key rather than a true modifier, but it gates drag-pan the
same way (Figma / Sketch style), so it rides the same vocabulary.
