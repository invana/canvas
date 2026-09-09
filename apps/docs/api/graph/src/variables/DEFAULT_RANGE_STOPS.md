# Variable: DEFAULT\_RANGE\_STOPS

> `const` **DEFAULT\_RANGE\_STOPS**: readonly `number`[]

Default ramp for `mode: 'range'` — a **sequential single-hue** scale
(light → dark blue).

Single-hue on purpose. Interpolation happens in sRGB, where a ramp between
distant hues can pass near grey at its midpoint and read as "no data" exactly
where mid-range values live. A single hue is both the conventionally correct
default for a magnitude and immune to that. Multi-hue and diverging ramps are
opt-in via [ColorByBehaviourOptions.colorStops](../interfaces/ColorByBehaviourOptions.md#colorstops), where the caller is
choosing the endpoints deliberately.
