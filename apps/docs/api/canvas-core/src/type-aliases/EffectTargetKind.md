# Type Alias: EffectTargetKind

> **EffectTargetKind** = `"shape"` \| `"connector"` \| `"both"`

Information a shape effect receives in `mount` / `update`. No `surface`
field — effects don't draw, they modulate. The renderer applies the
effect's `readTransform` / `readStyle` output onto the host gfx each frame.
