# Function: loadIconFont()

> **loadIconFont**(`stylesheetUrl`, `fontFamilyToProbe?`, `fontWeightToProbe?`, `fontStyleToProbe?`): `Promise`\<`void`\>

Defined in: [canvas/src/fonts/loadIconFont.ts:37](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/fonts/loadIconFont.ts#L37)

`loadIconFont` — inject an icon-font stylesheet at runtime, then await
font readiness so the very first paint rasterises against the real
webfont (not a fallback with the wrong metrics).

The mechanic:

  1. Attaching `<link rel="stylesheet" href=…>` kicks off:
     stylesheet download → CSS parse → `@font-face` registration → WOFF
     fetch.
  2. The browser's `FontFaceSet` only knows about the family **after**
     the `@font-face` declaration is parsed — calling
     `document.fonts.load(…)` before that returns an empty result.
  3. So we wait for the link's `load` event first, then ask the
     `FontFaceSet` to actually load the face.

Vendor-agnostic: takes any stylesheet URL and any font-family name. The
canvas library does not know about Font Awesome / Material Symbols /
Phosphor / Heroicons / etc. — consumers point this at whichever icon
font (or regular webfont) they want.

## Parameters

### stylesheetUrl

`string`

### fontFamilyToProbe?

`string`

### fontWeightToProbe?

`string` \| `number`

### fontStyleToProbe?

`"normal"` \| `"italic"`

## Returns

`Promise`\<`void`\>

## Example

```ts
await loadIconFont(
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'Font Awesome 6 Free',
);
// now safe to render `{ kind: 'glyph', char: '', fontFamily: 'Font Awesome 6 Free', fontWeight: 900 }`.
```

Idempotent: subsequent calls with the same `stylesheetUrl` reuse the
existing `<link>` element. Safe to call from N stories that all use the
same icon font.

SSR-safe: a no-op when `document` is undefined.
