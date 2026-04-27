# BackgroundPlugin

Renders a solid color or tiled pattern as a screen-space background. The layer sits below all world-space content and is unaffected by camera pan/zoom by default.

## Installation

```ts
import { BackgroundPlugin } from '@invana/canvas';

const bg = new BackgroundPlugin({
  type: 'pattern',
  patternType: 'dots',
  backgroundColor: '#1a1a2e',
  color: '#595959',
  spacing: 30,
  alpha: 0.6,
});

await canvas.plugins.register(bg);
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | `'solid' \| 'pattern'` | `'solid'` | Background style — flat color or tiled pattern |
| `patternType` | `'dots' \| 'grid' \| 'lines'` | `'dots'` | Pattern variant (only used when `type: 'pattern'`) |
| `backgroundColor` | `string \| number` | `'#1a1a2e'` | Canvas fill color |
| `color` | `string \| number` | `'#595959'` | Pattern element color |
| `size` | `number` | `1.5` | Size of each pattern element (dot radius, line width) in pixels |
| `spacing` | `number` | `30` | Distance between pattern elements in pixels |
| `alpha` | `number` | `0.6` | Pattern opacity (0–1) |
| `followCamera` | `boolean` | `false` | When `true`, the pattern shifts and scales with the camera — creates an infinite scrolling grid effect |
| `key` | `string` | `'background'` | Plugin id override — set when registering multiple instances |

## Multiple instances

Use the `key` option to register multiple background layers:

```ts
await canvas.plugins.register(
  new BackgroundPlugin({ type: 'solid', backgroundColor: '#000', key: 'bg-solid' })
);
await canvas.plugins.register(
  new BackgroundPlugin({ type: 'pattern', patternType: 'grid', key: 'bg-grid' })
);
```

## Pattern examples

### Solid

```ts
new BackgroundPlugin({ type: 'solid', backgroundColor: '#212121' })
```

### Dots

```ts
new BackgroundPlugin({
  type: 'pattern',
  patternType: 'dots',
  backgroundColor: '#212121',
  color: '#595959',
  size: 1.5,
  spacing: 30,
  alpha: 0.6,
})
```

### Grid

```ts
new BackgroundPlugin({
  type: 'pattern',
  patternType: 'grid',
  backgroundColor: '#0d1117',
  color: '#30363d',
  size: 1,
  spacing: 40,
  alpha: 0.5,
})
```

### Scrolling grid (follows camera)

```ts
new BackgroundPlugin({
  type: 'pattern',
  patternType: 'grid',
  backgroundColor: '#0d1117',
  color: '#30363d',
  spacing: 40,
  followCamera: true,
})
```
