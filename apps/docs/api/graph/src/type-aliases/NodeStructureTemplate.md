# Type Alias: NodeStructureTemplate

> **NodeStructureTemplate** = [`SimpleStructure`](../interfaces/SimpleStructure.md) \| [`CardStructure`](../interfaces/CardStructure.md) \| [`FreeformStructure`](../interfaces/FreeformStructure.md)

A reusable node skeleton:
- [SimpleStructure](../interfaces/SimpleStructure.md) — one shape + a label (lean path).
- [CardStructure](../interfaces/CardStructure.md) — a composite card auto-laid-out as rows of slots.
- [FreeformStructure](../interfaces/FreeformStructure.md) — a composite card whose elements are placed at
  absolute coordinates (what the visual **card designer** produces). It's
  self-contained: each element carries its own data binding + colour role, so
  it needs no separate styling/binding template.
