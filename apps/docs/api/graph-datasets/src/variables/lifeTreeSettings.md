# Variable: lifeTreeSettings

> `const` **lifeTreeSettings**: [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

Recommended look for the **tree of life** phylogeny.

A phylogeny is read radially — every clade fans from a common root — so this
expects a hierarchical layout under the id `layout` in `radial-tree` mode. Branch
lengths live on `data.length`; the layout, not these settings, decides whether to
honour them.
