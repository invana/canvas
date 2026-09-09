# Function: dockCardClassName()

> **dockCardClassName**(`side?`): `string`

Class recipe for a full-height side **dock** — pass as `className` of a
`NodeDetailView` / `EdgeDetailView`. Absolutely pins to `side` and spans
top → bottom (`inset-y-0`), translucent + scrollable + square.

To inset it **below floating chrome**, pass explicit `top` / `bottom` via the
`style` prop (inline style overrides the baked `inset-y-0`).

```tsx
<NodeDetailView ctx={ctx} className={dockCardClassName('right')} />
<NodeDetailView ctx={ctx} className={dockCardClassName('right')}
  style={{ top: 40, bottom: 25 }} />   // clear a 40px header + 25px footer
```

## Parameters

### side?

`"left"` \| `"right"`

## Returns

`string`
