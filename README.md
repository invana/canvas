# @invana/canvas

High-performance WebGPU-first canvas rendering engine and visualization toolkit.

## Packages

| Package | Description |
|---------|-------------|
| [@invana/canvas-core](./packages/canvas-core) | Core rendering engine with WebGPU/WebGL support |
| [@invana/canvas-utils](./packages/canvas-utils) | Shared utilities (math, color, etc.) |

## Quick Start

```bash
pnpm install
pnpm build
pnpm storybook
```


```bash
pnpm --filter @invana/canvas-core build 
pnpm --filter @invana/layouts-d3-force build
```

## Features

- WebGPU-first with WebGL2 fallback
- Theming system with light/dark modes
- Plugin architecture for extensibility
- Multiple node shapes and edge types
- Rich interactions - pan, zoom, drag, select
- Built-in animations

## License

MIT
