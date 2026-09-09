# Type Alias: DensityContourPaletteName

> **DensityContourPaletteName** = `"blues"` \| `"greens"` \| `"oranges"` \| `"purples"` \| `"reds"` \| `"viridis"` \| `"plasma"` \| `"magma"` \| `"inferno"` \| `"warm"` \| `"cool"`

Built-in colour ramps for DensityContourLayer.

Each palette is an ordered array of `0xRRGGBB` stops from low-density to
high-density. The layer interpolates between adjacent stops so any band
count (3, 10, 30...) lands on a perceptually-smooth colour.

Sequential single-hue palettes (`blues`, `greens`, ...) are drawn from
ColorBrewer; perceptual ramps (`viridis`, `plasma`, `magma`, `inferno`)
are 10-stop quantizations of matplotlib's perceptual colour maps. `warm`
and `cool` are ColorBrewer YlOrRd / BuPu equivalents.
