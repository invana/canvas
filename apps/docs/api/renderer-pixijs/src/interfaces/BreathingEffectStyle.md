# Interface: BreathingEffectStyle

Style options for `BreathingEffect`.

- `amplitude` — fractional scale swing. `0.05` means the host scales
  between `0.95` and `1.05`. Default `0.05`.
- `periodMs` — duration of one full breath cycle. Default `1800`.
- `axis` — `'both' | 'x' | 'y'`. Default `'both'`.
- `phaseOffsetMs` — start time offset; lets multiple breathing hosts
  desync visually. Default `0`.

## Properties

### amplitude?

> `readonly` `optional` **amplitude?**: `number`

***

### axis?

> `readonly` `optional` **axis?**: `"both"` \| `"x"` \| `"y"`

***

### periodMs?

> `readonly` `optional` **periodMs?**: `number`

***

### phaseOffsetMs?

> `readonly` `optional` **phaseOffsetMs?**: `number`
