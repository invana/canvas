# Type Alias: ColorByScale

> **ColorByScale** = `"linear"` \| `"sqrt"` \| `"log"` \| `"quantile"` \| `"threshold"`

Curve / binning mapping a numeric value to a colour. Continuous curves
interpolate along `colorStops`; binning scales quantise into discrete steps.
`'linear' | 'sqrt' | 'log'` match `NodeCentralityScale` deliberately.
