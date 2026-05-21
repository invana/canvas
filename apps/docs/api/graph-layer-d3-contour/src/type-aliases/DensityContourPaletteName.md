# Type Alias: DensityContourPaletteName

> **DensityContourPaletteName** = `"blues"` \| `"greens"` \| `"oranges"` \| `"purples"` \| `"reds"` \| `"viridis"` \| `"plasma"` \| `"magma"` \| `"inferno"` \| `"warm"` \| `"cool"`

Defined in: [graph-layer-d3-contour/src/palettes.ts:14](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-d3-contour/src/palettes.ts#L14)

Built-in colour ramps for DensityContourLayer.

Each palette is an ordered array of `0xRRGGBB` stops from low-density to
high-density. The layer interpolates between adjacent stops so any band
count (3, 10, 30...) lands on a perceptually-smooth colour.

Sequential single-hue palettes (`blues`, `greens`, ...) are drawn from
ColorBrewer; perceptual ramps (`viridis`, `plasma`, `magma`, `inferno`)
are 10-stop quantizations of matplotlib's perceptual colour maps. `warm`
and `cool` are ColorBrewer YlOrRd / BuPu equivalents.
