# Variable: LOOP\_CURVE\_PRESETS

> `const` **LOOP\_CURVE\_PRESETS**: `object`

Defined in: [canvas/src/primitives/connectors/pathStyles/loopCurve.ts:97](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/connectors/pathStyles/loopCurve.ts#L97)

Named loop-curve shape presets. Each preset carries the four
profile-shaping opts (`baseOffset`, `radius`, `width`, `bulge`); the
caller fills in placement (`side` / `angle`, `pivotOffset`) per
instance. Spread into `pathStyleOpts`:

  pathStyleOpts: { ...LOOP_CURVE_PRESETS.balloon, side: 'top' }

Definitions:
  - `balloon`  — fat puffed belly. `bulge >> width/2` → controls
    splay wide; `bulge > radius` → belly bulges past the tip.
  - `teardrop` — slender pointed petal. `radius >> bulge`, narrow
    `width` → long axis with controls converging toward the tip.
  - `ring`     — near-circular loop. `radius ≈ bulge`, modest neck.
  - `hairpin`  — parallel-sided U (legacy). `bulge ≈ width/2` →
    controls sit directly above the feet, no flare.

## Type Declaration

### balloon

> `readonly` **balloon**: `object`

#### balloon.baseOffset

> `readonly` **baseOffset**: `2` = `2`

#### balloon.bulge

> `readonly` **bulge**: `26` = `26`

#### balloon.radius

> `readonly` **radius**: `22` = `22`

#### balloon.width

> `readonly` **width**: `6` = `6`

### hairpin

> `readonly` **hairpin**: `object`

#### hairpin.baseOffset

> `readonly` **baseOffset**: `2` = `2`

#### hairpin.bulge

> `readonly` **bulge**: `4` = `4`

#### hairpin.radius

> `readonly` **radius**: `28` = `28`

#### hairpin.width

> `readonly` **width**: `8` = `8`

### ring

> `readonly` **ring**: `object`

#### ring.baseOffset

> `readonly` **baseOffset**: `2` = `2`

#### ring.bulge

> `readonly` **bulge**: `20` = `20`

#### ring.radius

> `readonly` **radius**: `20` = `20`

#### ring.width

> `readonly` **width**: `10` = `10`

### teardrop

> `readonly` **teardrop**: `object`

#### teardrop.baseOffset

> `readonly` **baseOffset**: `2` = `2`

#### teardrop.bulge

> `readonly` **bulge**: `8` = `8`

#### teardrop.radius

> `readonly` **radius**: `34` = `34`

#### teardrop.width

> `readonly` **width**: `4` = `4`
