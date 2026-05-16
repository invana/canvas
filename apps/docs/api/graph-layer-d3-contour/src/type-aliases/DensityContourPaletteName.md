# Type Alias: DensityContourPaletteName

> **DensityContourPaletteName** = `"blues"` \| `"greens"` \| `"oranges"` \| `"purples"` \| `"reds"` \| `"viridis"` \| `"plasma"` \| `"magma"` \| `"inferno"` \| `"warm"` \| `"cool"`

Defined in: [graph-layer-d3-contour/src/palettes.ts:14](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/palettes.ts#L14)

Built-in colour ramps for DensityContourLayer.

Each palette is an ordered array of `0xRRGGBB` stops from low-density to
high-density. The layer interpolates between adjacent stops so any band
count (3, 10, 30...) lands on a perceptually-smooth colour.

Sequential single-hue palettes (`blues`, `greens`, ...) are drawn from
ColorBrewer; perceptual ramps (`viridis`, `plasma`, `magma`, `inferno`)
are 10-stop quantizations of matplotlib's perceptual colour maps. `warm`
and `cool` are ColorBrewer YlOrRd / BuPu equivalents.
