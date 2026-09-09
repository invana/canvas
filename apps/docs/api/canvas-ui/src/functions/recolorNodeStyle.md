# Function: recolorNodeStyle()

> **recolorNodeStyle**(`style`, `color`): `Partial`\<`NodeStyle`\>

Build the `Partial<NodeStyle>` patch that recolours a node — the "works for
both kinds" bridge:

- **composite / card** (`style.shape.kind === 'composite'`) → recolour the
  card **body** `fill` **and** every solid **accent part** (a `rect` / `circle`
  part that already carries a `fill`). Label parts keep their text colour so
  copy stays readable.
- **simple shape** → set `bgFill`.

Spread over the node's resolved style on apply (since `updateNode` replaces
`style` wholesale):
`store.updateNode(id, { style: { ...resolveNodeStyle(node), ...recolorNodeStyle(style, color) } })`.

## Parameters

### style

`Partial`\<`NodeStyle`\>

### color

`number`

## Returns

`Partial`\<`NodeStyle`\>
