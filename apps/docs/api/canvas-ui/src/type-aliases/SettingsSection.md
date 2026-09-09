# Type Alias: SettingsSection

> **SettingsSection** = `"layers"` \| `"behaviours"` \| `"layouts"`

The three id-keyed config sections, mirroring `CanvasConfig`
(`layers` / `behaviours` / `layouts`). A patch for an instance applies under
its section: `canvas.update({ [section]: { [id]: patch } })`.
