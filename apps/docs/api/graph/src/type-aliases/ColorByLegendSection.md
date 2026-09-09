# Type Alias: ColorByLegendSection

> **ColorByLegendSection** = \{ `entries`: `object`[]; `field`: `string`; `kind`: `"categories"`; `other?`: \{ `color`: `number`; `count`: `number`; \}; \} \| \{ `bins`: `object`[]; `field`: `string`; `kind`: `"bins"`; \} \| \{ `domain`: \[`number`, `number`\]; `field`: `string`; `kind`: `"gradient"`; `stops`: readonly `number`[]; \}

What a legend should render for one channel. Derived from the same resolved
options and domain the canvas is painted from, so the two can never disagree.

## Union Members

### Type Literal

\{ `entries`: `object`[]; `field`: `string`; `kind`: `"categories"`; `other?`: \{ `color`: `number`; `count`: `number`; \}; \}

#### entries

> **entries**: `object`[]

#### field

> **field**: `string`

The field path (or `'(computed)'` when a `*ValueBy` accessor is in use).

#### kind

> **kind**: `"categories"`

#### other?

> `optional` **other?**: `object`

Values beyond `maxCategories`, collapsed. Absent when nothing was capped.

##### other.color

> **color**: `number`

##### other.count

> **count**: `number`

***

### Type Literal

\{ `bins`: `object`[]; `field`: `string`; `kind`: `"bins"`; \}

***

### Type Literal

\{ `domain`: \[`number`, `number`\]; `field`: `string`; `kind`: `"gradient"`; `stops`: readonly `number`[]; \}
