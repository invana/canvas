# Type Alias: FillFit

> **FillFit** = `"fill"` \| `"cover"` \| `"none"` \| `"scale-down"`

Defined in: [packages/canvas/src/renderers/draw/types.ts:44](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L44)

Controls how a texture fill is sized within a shape's bounding box.
Only meaningful when `fill` is a `Texture`; ignored for solid-color fills.

- `'fill'`       — stretch to fit exactly (default). Ignores aspect ratio.
- `'cover'`      — scale uniformly so the image covers the box; crops the overflow. Centered.
- `'none'`       — natural pixel size, centered. Larger images are cropped; smaller images
                   show the clamped edge pixel in the gap (PixiJS UV clamp limitation).
- `'scale-down'` — like `'none'` but downscales when the image is larger than the box.
                   Never upscales — equivalent to `min(none, contain)`.

Note: `'contain'` is intentionally omitted. PixiJS clamps out-of-range UVs to the
edge pixel, so letterbox gaps fill with the image border rather than being transparent.
