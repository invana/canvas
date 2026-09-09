# Variable: h1b2019Settings

> `const` **h1b2019Settings**: [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

Recommended look for the **H-1B 2019** state → city → employer hierarchy.

Four levels and thousands of leaves, so this expects a hierarchical layout
mounted under the id `layout` — radial or pack, where the leaf count is the point.
Marks stay tiny and labels off by default; a consumer that wants employer names
turns them on for the depth it cares about.
