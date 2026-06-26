# Function: dockCardClassName()

> **dockCardClassName**(`side?`): `string`

Defined in: [canvas-react/src/toolbars/detailView.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/toolbars/detailView.ts#L64)

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
