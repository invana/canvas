# Variable: flareSettings

> `const` **flareSettings**: [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

Recommended look for the **Flare** package hierarchy.

The flattened Flare tree is the canonical d3-hierarchy fixture, so these
settings assume a hierarchical layout the consumer mounts under the id `layout`
(`D3HierarchyLayout` in `tree` mode is the obvious pick) rather than the bundle's
force sim. Leaves and branches are the same mark — depth is carried by position.
